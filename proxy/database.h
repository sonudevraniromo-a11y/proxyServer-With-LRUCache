#ifndef DATABASE_H
#define DATABASE_H

#include <stddef.h>
#include "threads.h"

typedef struct {
    void *connection;
    void *statement;
    mtx_t mutex;
    int enabled;
} Database;

int database_init(Database *database);
void database_destroy(Database *database);
void database_log(Database *database, const char *url, const char *method,
                  const char *thread_id, int cache_hit, int status_code,
                  double response_time_ms, size_t request_size,
                  size_t response_size);

#endif
