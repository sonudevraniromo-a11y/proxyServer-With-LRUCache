#ifndef REQUEST_QUEUE_H
#define REQUEST_QUEUE_H

#include <stddef.h>
#include "threads.h"

typedef struct {
    int client_socket;
    unsigned long request_id;
} ClientRequest;

typedef struct {
    ClientRequest *items;
    size_t capacity;
    size_t head;
    size_t tail;
    size_t count;
    int closed;
    mtx_t mutex;
    cnd_t not_empty;
    cnd_t not_full;
} RequestQueue;

int queue_init(RequestQueue *queue, size_t capacity);
void queue_close(RequestQueue *queue);
void queue_destroy(RequestQueue *queue);
int queue_push(RequestQueue *queue, ClientRequest request);
int queue_pop(RequestQueue *queue, ClientRequest *request);

#endif
