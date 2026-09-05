#ifndef HTTP_PARSER_H
#define HTTP_PARSER_H

typedef struct {
    char method[16];
    char host[256];
    char path[2048];
    int port;
} HttpRequest;

int parse_http_request(const char *raw, HttpRequest *request);

#endif
