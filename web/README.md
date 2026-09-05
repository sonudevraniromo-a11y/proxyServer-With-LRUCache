# RELAY. Web Application

This folder is a React + Vite frontend for the existing C11 proxy. It does not implement sockets, concurrency, cache behavior, or proxy logic.

## Run

```powershell
cd web
npm install
npm run dev
```

Vite opens `http://localhost:5173` automatically. The API bridge runs on `http://localhost:3001` and Vite proxies `/api` requests to it.

Set these variables before starting the API when using the real services:

```text
DATABASE_URL=postgres://user:password@localhost:5432/relay
PROXY_HOST=127.0.0.1
PROXY_PORT=8080
API_PORT=3001
```

## What is real

Signup hashes passwords with bcrypt and always inserts the `USER` role. Login reads the existing `users` table and creates an in-memory session. Admin creation is intentionally not exposed publicly. Password reset is reported as unavailable because the existing backend has no reset-token or email support.

Analytics reads `request_logs`, `cache_metadata`, and grouped thread records from PostgreSQL using parameterized queries. Empty tables produce an explicit empty state. The current C proxy does not write request logs, cache metadata, or metrics, so analytics remains unavailable until that backend logger exists.

Search accepts the current proxy's supported protocol: HTTP `GET` requests. The API bridge opens a raw TCP connection to `PROXY_HOST:PROXY_PORT`, sends the parsed host/path request expected by `proxy/main.c`, and returns the actual response. The React page displays that returned response in a local blob frame. HTTPS is rejected honestly because the existing C proxy does not implement `CONNECT`.

## Backend contract discovered

The existing proxy defaults to port `8080`, accepts raw TCP HTTP requests, requires a `Host` header, supports `GET`, and returns a normal HTTP response. It has no REST endpoint, request metadata response, or database logger. Therefore the frontend hides worker ID, cache HIT/MISS, response timing, and cache statistics for search requests unless those fields arrive from the database in future backend work.

## Build

```powershell
npm run build
npm run preview
```
