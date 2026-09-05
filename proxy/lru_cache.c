#include "lru_cache.h"
#include <stdlib.h>
#include <string.h>

typedef struct CacheNode { char *key, *data; size_t size; struct CacheNode *prev, *next, *hash_next; } CacheNode;
static char *copy_string(const char *value) { size_t length = strlen(value) + 1; char *copy = malloc(length); if (copy) memcpy(copy, value, length); return copy; }
static size_t hash_key(const char *key) { size_t h = 5381; while (*key) h = ((h << 5) + h) ^ (unsigned char)*key++; return h; }
static void unlink_node(LruCache *c, CacheNode *n) { if (n->prev) n->prev->next = n->next; else c->head = n->next; if (n->next) n->next->prev = n->prev; else c->tail = n->prev; }
static void front(LruCache *c, CacheNode *n) { n->prev = NULL; n->next = c->head; if (c->head) c->head->prev = n; else c->tail = n; c->head = n; }
static CacheNode *find_node(LruCache *c, const char *key, size_t *bucket) { *bucket = hash_key(key) % c->bucket_count; for (CacheNode *n = c->buckets[*bucket]; n; n = n->hash_next) if (!strcmp(n->key, key)) return n; return NULL; }
static void remove_hash(LruCache *c, CacheNode *n) { size_t b; CacheNode **p; find_node(c, n->key, &b); p = &c->buckets[b]; while (*p && *p != n) p = &(*p)->hash_next; if (*p) *p = n->hash_next; }
int cache_init(LruCache *c, size_t capacity) { memset(c, 0, sizeof(*c)); c->bucket_count = 257; c->capacity = capacity; c->buckets = calloc(c->bucket_count, sizeof(*c->buckets)); return c->buckets && mtx_init(&c->mutex, mtx_plain) == thrd_success ? 0 : -1; }
void cache_destroy(LruCache *c) { mtx_lock(&c->mutex); CacheNode *n = c->head; while (n) { CacheNode *next = n->next; free(n->key); free(n->data); free(n); n = next; } free(c->buckets); mtx_unlock(&c->mutex); mtx_destroy(&c->mutex); }
int cache_get(LruCache *c, const char *key, char **data, size_t *size) { mtx_lock(&c->mutex); size_t b; CacheNode *n = find_node(c, key, &b); if (!n) { mtx_unlock(&c->mutex); return 0; } unlink_node(c, n); front(c, n); *data = malloc(n->size); if (*data) memcpy(*data, n->data, n->size); *size = n->size; mtx_unlock(&c->mutex); return *data ? 1 : -1; }
int cache_put(LruCache *c, const char *key, const char *data, size_t size) { if (size > c->capacity) return 0; mtx_lock(&c->mutex); size_t b; CacheNode *old = find_node(c, key, &b); if (old) { remove_hash(c, old); unlink_node(c, old); c->used -= old->size; free(old->key); free(old->data); free(old); } while (c->used + size > c->capacity && c->tail) { CacheNode *evict = c->tail; remove_hash(c, evict); unlink_node(c, evict); c->used -= evict->size; free(evict->key); free(evict->data); free(evict); } CacheNode *n = calloc(1, sizeof(*n)); if (!n || !(n->key = copy_string(key)) || !(n->data = malloc(size))) { free(n ? n->key : NULL); free(n); mtx_unlock(&c->mutex); return -1; } memcpy(n->data, data, size); n->size = size; n->hash_next = c->buckets[b]; c->buckets[b] = n; front(c, n); c->used += size; mtx_unlock(&c->mutex); return 1; }
size_t cache_count(LruCache *c) { mtx_lock(&c->mutex); size_t count = 0; for (CacheNode *n = c->head; n; n = n->next) count++; mtx_unlock(&c->mutex); return count; }
