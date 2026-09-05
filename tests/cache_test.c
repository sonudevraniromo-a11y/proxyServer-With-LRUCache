#include "../proxy/lru_cache.h"
#include <assert.h>
#include <stdlib.h>
#include <string.h>
int main(void) { LruCache cache; assert(cache_init(&cache, 8) == 0); assert(cache_put(&cache, "a", "1234", 4) == 1); char *data; size_t size; assert(cache_get(&cache, "a", &data, &size) == 1); assert(size == 4 && !memcmp(data, "1234", 4)); free(data); cache_destroy(&cache); return 0; }
