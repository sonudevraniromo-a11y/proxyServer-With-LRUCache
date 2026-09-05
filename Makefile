CC ?= gcc
CFLAGS ?= -std=c11 -Wall -Wextra -O2
ifeq ($(OS),Windows_NT)
  MYSQL_HOME ?= C:/Program Files/MySQL/MySQL Server 8.0
  CC = x86_64-w64-mingw32-gcc
  CFLAGS += -I"$(MYSQL_HOME)/include"
  LDLIBS = -lws2_32 "$(MYSQL_HOME)/lib/libmysql.lib"
else
  LDLIBS =
endif

proxy: proxy/main.c proxy/request_queue.c proxy/http_parser.c proxy/lru_cache.c proxy/database.c
	$(CC) $(CFLAGS) -Iproxy $^ -o proxy-server $(LDLIBS)

clean:
	$(RM) proxy-server

.PHONY: proxy clean
