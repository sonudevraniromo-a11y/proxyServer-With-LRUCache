#include "http_parser.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int parse_http_request(const char *raw, HttpRequest *request) {
    char version[16];
    char host_header[256] = {0};
    if (sscanf(raw, "%15s %2047s %15s", request->method, request->path, version) != 3 ||
        strcmp(request->method, "GET") != 0) return -1;
    const char *host = strstr(raw, "\nHost:");
    if (!host) host = strstr(raw, "\nhost:");
    if (!host || sscanf(host + 6, " %255[^\r\n]", host_header) != 1) return -1;
    request->port = 80;
    char *colon = strchr(host_header, ':');
    if (colon) { *colon = '\0'; request->port = atoi(colon + 1); }
    if (request->port < 1 || request->port > 65535 || host_header[0] == '\0') return -1;
    strncpy(request->host, host_header, sizeof(request->host) - 1);
    return 0;
}
