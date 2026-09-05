#include "config.h"
#include "request_queue.h"
#include "http_parser.h"
#include "lru_cache.h"
#include "database.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#define close_socket closesocket
#else
#include <unistd.h>
#include <netdb.h>
#include <sys/socket.h>
#define close_socket close
#endif

static RequestQueue queue;
static LruCache cache;
static thrd_t *workers;
static int listen_socket;
static Database database;

typedef struct { int id; } WorkerContext;

static double clock_ms(void) {
#ifdef _WIN32
    return (double)GetTickCount();
#else
    struct timespec value;
    clock_gettime(CLOCK_MONOTONIC, &value);
    return value.tv_sec * 1000.0 + value.tv_nsec / 1000000.0;
#endif
}

static int response_status(const char *response, size_t size) {
    int status = 0;
    if (size > 0) sscanf(response, "HTTP/%*s %d", &status);
    return status;
}

static int connect_remote(const HttpRequest *request) {
    char port[8];
    struct addrinfo hints = {0}, *result = NULL;
    snprintf(port, sizeof(port), "%d", request->port);
    hints.ai_socktype = SOCK_STREAM;
    hints.ai_family = AF_UNSPEC;
    if (getaddrinfo(request->host, port, &hints, &result) != 0) return -1;
    int socket_fd = (int)socket(result->ai_family, result->ai_socktype, result->ai_protocol);
    if (socket_fd < 0 || connect(socket_fd, result->ai_addr, (int)result->ai_addrlen) < 0) {
        if (socket_fd >= 0) close_socket(socket_fd);
        freeaddrinfo(result);
        return -1;
    }
    freeaddrinfo(result);
    return socket_fd;
}

static int worker(void *argument) {
    WorkerContext *context = argument;
    char thread_id[32];
    snprintf(thread_id, sizeof(thread_id), "worker-%d", context->id);
    char raw[MAX_REQUEST_SIZE];
    for (;;) {
        ClientRequest item;
        if (queue_pop(&queue, &item) != 0) return 0;
        int received = (int)recv(item.client_socket, raw, sizeof(raw) - 1, 0);
        if (received <= 0) { close_socket(item.client_socket); continue; }
        raw[received] = '\0';
        double started = clock_ms();
        HttpRequest request;
        if (parse_http_request(raw, &request) != 0) {
            const char *bad = "HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n";
            send(item.client_socket, bad, (int)strlen(bad), 0);
            close_socket(item.client_socket);
            continue;
        }
        char key[2304];
        snprintf(key, sizeof(key), "%s:%d%s", request.host, request.port, request.path);
        char *cached = NULL;
        size_t cached_size = 0;
        if (cache_get(&cache, key, &cached, &cached_size) == 1) {
            send(item.client_socket, cached, (int)cached_size, 0);
            database_log(&database, key, request.method, thread_id, 1, response_status(cached, cached_size), clock_ms() - started, (size_t)received, cached_size);
            free(cached);
            close_socket(item.client_socket);
            continue;
        }
        int remote = connect_remote(&request);
        if (remote < 0) {
            const char *unavailable = "HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n";
            send(item.client_socket, unavailable, (int)strlen(unavailable), 0);
            database_log(&database, key, request.method, thread_id, 0, 502, clock_ms() - started, (size_t)received, 0);
            close_socket(item.client_socket);
            continue;
        }
        char forward[MAX_REQUEST_SIZE];
        snprintf(forward, sizeof(forward), "GET %s HTTP/1.0\r\nHost: %s\r\nConnection: close\r\n\r\n", request.path, request.host);
        send(remote, forward, (int)strlen(forward), 0);
        char *response = malloc(MAX_RESPONSE_SIZE);
        size_t total = 0;
        if (response) {
            while (total < MAX_RESPONSE_SIZE) {
                int count = (int)recv(remote, response + total, (int)(MAX_RESPONSE_SIZE - total), 0);
                if (count <= 0) break;
                send(item.client_socket, response + total, count, 0);
                total += (size_t)count;
            }
            if (total > 0) cache_put(&cache, key, response, total);
            database_log(&database, key, request.method, thread_id, 0, response_status(response, total), clock_ms() - started, (size_t)received, total);
            free(response);
        }
        close_socket(remote);
        close_socket(item.client_socket);
    }
}

int main(int argc, char **argv) {
    int port = argc > 1 ? atoi(argv[1]) : DEFAULT_PROXY_PORT;
    int worker_count = argc > 2 ? atoi(argv[2]) : DEFAULT_WORKERS;
#ifdef _WIN32
    WSADATA data;
    if (WSAStartup(MAKEWORD(2, 2), &data) != 0) return 1;
#endif
    listen_socket = (int)socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in address = {0};
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = htonl(INADDR_ANY);
    address.sin_port = htons((unsigned short)port);
    if (listen_socket < 0 || bind(listen_socket, (struct sockaddr *)&address, sizeof(address)) < 0 || listen(listen_socket, 64) < 0) {
        perror("proxy socket");
        return 1;
    }
    if (queue_init(&queue, DEFAULT_QUEUE_CAPACITY) != 0 || cache_init(&cache, DEFAULT_CACHE_CAPACITY) != 0) return 1;
    workers = calloc((size_t)worker_count, sizeof(*workers));
    if (!workers) return 1;
    WorkerContext *contexts = calloc((size_t)worker_count, sizeof(*contexts));
    if (!contexts) return 1;
    if (database_init(&database) != 0) fprintf(stderr, "MySQL logging disabled; configure DATABASE_* variables.\n");
    for (int index = 0; index < worker_count; index++) { contexts[index].id = index + 1; thrd_create(&workers[index], worker, &contexts[index]); }
    printf("Proxy listening on port %d with %d workers\n", port, worker_count);
    unsigned long id = 1;
    for (;;) {
        int client = (int)accept(listen_socket, NULL, NULL);
        if (client < 0) continue;
        if (queue_push(&queue, (ClientRequest){client, id++}) != 0) close_socket(client);
    }
#ifdef _WIN32
    WSACleanup();
#endif
    return 0;
}
