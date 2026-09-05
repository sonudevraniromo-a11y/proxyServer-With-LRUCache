# Relay: Multi-Threaded Proxy Server with LRU Cache and Database Analytics

Relay is an academic systems project with two deliberately separate applications:

```text
Browser -> C proxy (TCP acceptor) -> worker pool -> LRU cache -> web server
                                      |
                                      +-> MySQL analytics

Web browser -> Node web application -> MySQL :3305
```

## Run the web application

```powershell
cd web
npm install
$env:DATABASE_HOST = 'localhost'
$env:DATABASE_PORT = '3305'
$env:DATABASE_NAME = 'relay_db'
$env:DATABASE_USER = 'root'
$env:DATABASE_PASSWORD = 'your-mysql-password'
npm run dev
```

Open `http://localhost:5173`. Authentication and analytics require the configured MySQL database; the application does not use fake accounts or analytics.

For MySQL:

```powershell
& 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe' -h localhost -P 3305 -u root -p < database/schema.sql
& 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe' -h localhost -P 3305 -u root -p relay_db < database/seed.sql
```

The web app reads request logs from MySQL. The C proxy uses MySQL Connector/C to insert request records after each completed request. The schema and SQL analytics are in `database/`.

## Build and run the C proxy

On Windows with MinGW:

```powershell
mingw32-make proxy
.\proxy-server.exe 8080 8
```

On Linux/macOS, use a C11 compiler and `make proxy`. Native `<threads.h>` is preferred; `proxy/threads.h` supplies a Win32 compatibility implementation when this MinGW installation does not ship that header. The public API remains the C11 `thrd_*`, `mtx_*`, and `cnd_*` API.

The main thread accepts sockets and pushes them into a bounded producer-consumer queue. Workers block on `cnd_wait()` when the queue is empty, wake after `cnd_signal()`, parse a request, and perform network I/O. The LRU hash map and doubly linked list are protected by one cache mutex only while lookup or mutation occurs; remote connection and response reads never hold that mutex. Cache misses are forwarded to the destination, streamed back to the client, then inserted into memory when below the response limit.

Current proxy scope is intentionally explicit: HTTP/1.0/1.1 `GET`, `Host`, port 1-65535, bounded requests/responses, 502 for destination failures, and 400 for malformed/unsupported requests. HTTPS CONNECT, chunk decoding, and graceful signal shutdown remain follow-up production features.

## Tests and load comparison

```powershell
gcc -std=c11 -Iproxy tests/cache_test.c proxy/lru_cache.c -o cache-test -lws2_32
.\cache-test.exe
node tests/load_test.js 10 10
```

Run the load script against a cache-enabled proxy and a fresh proxy configured with cache capacity `0`, then compare requests/sec, latency, and hit ratio from the dashboard/SQL queries. Repeat with 1, 5, 10, 25, 50, and 100 clients.
