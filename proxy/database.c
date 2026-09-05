#include "database.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <mysql.h>

static const char *environment_or_default(const char *name, const char *fallback) {
    const char *value = getenv(name);
    return value && value[0] ? value : fallback;
}

int database_init(Database *database) {
    const char *host = environment_or_default("DATABASE_HOST", "localhost");
    const char *user = environment_or_default("DATABASE_USER", "root");
    const char *name = environment_or_default("DATABASE_NAME", "relay_db");
    const char *password = environment_or_default("DATABASE_PASSWORD", "");
    unsigned int port = (unsigned int)strtoul(environment_or_default("DATABASE_PORT", "3305"), NULL, 10);
    MYSQL *connection = mysql_init(NULL);
    if (!connection || !mysql_real_connect(connection, host, user, password, name, port, NULL, 0)) {
        if (connection) mysql_close(connection);
        memset(database, 0, sizeof(*database));
        return -1;
    }
    MYSQL_STMT *statement = mysql_stmt_init(connection);
    const char *sql = "INSERT INTO request_logs (url, method, thread_id, cache_hit, status_code, response_time_ms, request_size, response_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    if (!statement || mysql_stmt_prepare(statement, sql, (unsigned long)strlen(sql)) != 0 || mtx_init(&database->mutex, mtx_plain) != thrd_success) {
        if (statement) mysql_stmt_close(statement);
        mysql_close(connection);
        memset(database, 0, sizeof(*database));
        return -1;
    }
    database->connection = connection;
    database->statement = statement;
    database->enabled = 1;
    return 0;
}

void database_destroy(Database *database) {
    if (!database->enabled) return;
    mtx_lock(&database->mutex);
    mysql_stmt_close((MYSQL_STMT *)database->statement);
    mysql_close((MYSQL *)database->connection);
    database->enabled = 0;
    mtx_unlock(&database->mutex);
    mtx_destroy(&database->mutex);
}

void database_log(Database *database, const char *url, const char *method,
                  const char *thread_id, int cache_hit, int status_code,
                  double response_time_ms, size_t request_size,
                  size_t response_size) {
    if (!database->enabled) return;
    MYSQL_BIND values[8];
    unsigned long url_length = (unsigned long)strlen(url);
    unsigned long method_length = (unsigned long)strlen(method);
    unsigned long thread_length = (unsigned long)strlen(thread_id);
    unsigned char hit = (unsigned char)(cache_hit ? 1 : 0);
    int status = status_code;
    int request_bytes = request_size > 2147483647U ? 2147483647 : (int)request_size;
    int response_bytes = response_size > 2147483647U ? 2147483647 : (int)response_size;
    memset(values, 0, sizeof(values));
    values[0].buffer_type = MYSQL_TYPE_STRING; values[0].buffer = (void *)url; values[0].buffer_length = url_length; values[0].length = &url_length;
    values[1].buffer_type = MYSQL_TYPE_STRING; values[1].buffer = (void *)method; values[1].buffer_length = method_length; values[1].length = &method_length;
    values[2].buffer_type = MYSQL_TYPE_STRING; values[2].buffer = (void *)thread_id; values[2].buffer_length = thread_length; values[2].length = &thread_length;
    values[3].buffer_type = MYSQL_TYPE_TINY; values[3].buffer = &hit;
    values[4].buffer_type = MYSQL_TYPE_LONG; values[4].buffer = &status;
    values[5].buffer_type = MYSQL_TYPE_DOUBLE; values[5].buffer = &response_time_ms;
    values[6].buffer_type = MYSQL_TYPE_LONG; values[6].buffer = &request_bytes;
    values[7].buffer_type = MYSQL_TYPE_LONG; values[7].buffer = &response_bytes;
    mtx_lock(&database->mutex);
    if (mysql_stmt_bind_param((MYSQL_STMT *)database->statement, values) == 0) mysql_stmt_execute((MYSQL_STMT *)database->statement);
    mtx_unlock(&database->mutex);
}
