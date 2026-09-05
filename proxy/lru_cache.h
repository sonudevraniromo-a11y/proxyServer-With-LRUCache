#ifndef LRU_CACHE_H
#define LRU_CACHE_H

#include <stddef.h>
#include "threads.h"

typedef struct CacheNode CacheNode;
typedef struct {
    CacheNode **buckets;
    size_t bucket_count;
    size_t capacity;
    size_t used;
    CacheNode *head;
    CacheNode *tail;
    mtx_t mutex;
} LruCache;

int cache_init(LruCache *cache, size_t capacity);
void cache_destroy(LruCache *cache);
int cache_get(LruCache *cache, const char *key, char **data, size_t *size);
int cache_put(LruCache *cache, const char *key, const char *data, size_t size);
size_t cache_count(LruCache *cache);

#endif
