#include "request_queue.h"
#include <stdlib.h>

int queue_init(RequestQueue *queue, size_t capacity) {
    queue->items = calloc(capacity, sizeof(*queue->items));
    if (!queue->items || mtx_init(&queue->mutex, mtx_plain) != thrd_success ||
        cnd_init(&queue->not_empty) != thrd_success || cnd_init(&queue->not_full) != thrd_success) {
        free(queue->items);
        return -1;
    }
    queue->capacity = capacity;
    return 0;
}

void queue_close(RequestQueue *queue) {
    mtx_lock(&queue->mutex);
    queue->closed = 1;
    cnd_broadcast(&queue->not_empty);
    cnd_broadcast(&queue->not_full);
    mtx_unlock(&queue->mutex);
}

void queue_destroy(RequestQueue *queue) {
    cnd_destroy(&queue->not_empty);
    cnd_destroy(&queue->not_full);
    mtx_destroy(&queue->mutex);
    free(queue->items);
}

int queue_push(RequestQueue *queue, ClientRequest request) {
    int result = 0;
    mtx_lock(&queue->mutex);
    while (queue->count == queue->capacity && !queue->closed) cnd_wait(&queue->not_full, &queue->mutex);
    if (queue->closed) result = -1;
    else {
        queue->items[queue->tail] = request;
        queue->tail = (queue->tail + 1) % queue->capacity;
        queue->count++;
        cnd_signal(&queue->not_empty);
    }
    mtx_unlock(&queue->mutex);
    return result;
}

int queue_pop(RequestQueue *queue, ClientRequest *request) {
    mtx_lock(&queue->mutex);
    while (queue->count == 0 && !queue->closed) cnd_wait(&queue->not_empty, &queue->mutex);
    if (queue->count == 0 && queue->closed) {
        mtx_unlock(&queue->mutex);
        return -1;
    }
    *request = queue->items[queue->head];
    queue->head = (queue->head + 1) % queue->capacity;
    queue->count--;
    cnd_signal(&queue->not_full);
    mtx_unlock(&queue->mutex);
    return 0;
}
