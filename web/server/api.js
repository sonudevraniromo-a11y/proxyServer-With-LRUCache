import "dotenv/config";
import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import net from "node:net";
import { URL } from "node:url";

const app = express();
const port = Number(process.env.API_PORT || 3001);
const proxyHost = process.env.PROXY_HOST || "127.0.0.1";
const proxyPort = Number(process.env.PROXY_PORT || 8080);
const pool = mysql.createPool({
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT || 3305),
  database: process.env.DATABASE_NAME || "relay_db",
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || "",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 5000,
});
const sessions = new Map();
app.use(express.json({ limit: "32kb" }));

async function requireDatabase(res, message = "Database unavailable.") {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    res.status(503).json({ error: message });
    return false;
  }
}
function requireSession(req, res, next) {
  const token = req.get("authorization")?.replace("Bearer ", "");
  const user = sessions.get(token);
  if (!user) return res.status(401).json({ error: "Authentication required." });
  req.user = user;
  next();
}
async function db(text, values) {
  const [rows] = await pool.execute(text, values);
  return rows;
}
function makeToken() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

app.get("/api/health", async (req, res) => {
  let database = "unavailable";
  let database_error;
  if (pool) {
    try {
      await pool.query("SELECT 1");
      database = "connected";
    } catch (error) {
      database_error =
        error.code === "ER_ACCESS_DENIED_ERROR"
          ? "credentials_rejected"
          : error.code === "ER_BAD_DB_ERROR"
            ? "database_missing"
            : error.code === "ECONNREFUSED"
              ? "server_unreachable"
              : "connection_failed";
    }
  }
  res.json({
    proxy: { host: proxyHost, port: proxyPort },
    database,
    ...(database_error ? { database_error } : {}),
  });
});
app.post("/api/auth/signup", async (req, res) => {
  if (
    !(await requireDatabase(
      res,
      "Authentication database unavailable. Set DATABASE_HOST, DATABASE_PORT, and DATABASE_PASSWORD, then start MySQL.",
    ))
  )
    return;
  const { name, username, email, password } = req.body || {};
  if (!name || !username || !email || !password)
    return res
      .status(400)
      .json({ error: "Name, username, email, and password are required." });
  const hash = await bcrypt.hash(password, 12);
  try {
    await db(
      "INSERT INTO users (name, username, email, password_hash, role) VALUES (?, ?, ?, ?, 'USER')",
      [name, username, email, hash],
    );
    const rows = await db(
      "SELECT id, name, username, email, role FROM users WHERE id = LAST_INSERT_ID()",
      [],
    );
    res.status(201).json({ user: rows[0] });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY")
      return res
        .status(409)
        .json({ error: "Username or email is already registered." });
    res.status(500).json({ error: "Unable to create account." });
  }
});
app.post("/api/auth/login", async (req, res) => {
  if (
    !(await requireDatabase(
      res,
      "Authentication database unavailable. Set DATABASE_HOST, DATABASE_PORT, and DATABASE_PASSWORD, then start MySQL.",
    ))
  )
    return;
  const { identifier, password } = req.body || {};
  if (!identifier || !password)
    return res
      .status(400)
      .json({ error: "Username/email and password are required." });
  try {
    const rows = await db(
      "SELECT id, name, username, email, role, password_hash FROM users WHERE username = ? OR email = ? LIMIT 1",
      [identifier, identifier],
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: "Invalid credentials." });
    const session = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    };
    const sessionToken = makeToken();
    sessions.set(sessionToken, session);
    await db("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [
      user.id,
    ]);
    res.json({ token: sessionToken, user: session });
  } catch {
    res.status(500).json({ error: "Authentication service unavailable." });
  }
});
app.post("/api/auth/logout", requireSession, (req, res) => {
  sessions.delete(req.get("authorization")?.replace("Bearer ", ""));
  res.status(204).end();
});
app.get("/api/auth/me", requireSession, (req, res) =>
  res.json({ user: req.user }),
);

app.get("/api/analytics/summary", requireSession, async (req, res) => {
  if (!(await requireDatabase(res))) return;
  try {
    const rows = await db(
      "SELECT COUNT(*) AS total_requests, SUM(CASE WHEN cache_hit = TRUE THEN 1 ELSE 0 END) AS cache_hits, SUM(CASE WHEN cache_hit = FALSE THEN 1 ELSE 0 END) AS cache_misses, AVG(response_time_ms) AS average_response_time, COALESCE(SUM(response_size), 0) AS total_data_transferred FROM request_logs",
      [],
    );
    const summary = rows[0];
    if (!summary.total_requests) return res.json({ empty: true });
    summary.hit_ratio = Number(
      ((summary.cache_hits / summary.total_requests) * 100).toFixed(1),
    );
    res.json(summary);
  } catch {
    res.status(503).json({ error: "Analytics database unavailable." });
  }
});
app.get("/api/analytics/requests", requireSession, async (req, res) => {
  if (!(await requireDatabase(res))) return;
  try {
    res.json({
      rows: await db(
        "SELECT id, url, method, thread_id, cache_hit, status_code, response_time_ms, request_size, response_size, created_at FROM request_logs ORDER BY created_at DESC LIMIT 200",
        [],
      ),
    });
  } catch {
    res.status(503).json({ error: "Analytics database unavailable." });
  }
});
app.get("/api/analytics/threads", requireSession, async (req, res) => {
  if (!(await requireDatabase(res))) return;
  try {
    res.json({
      rows: await db(
        "SELECT thread_id, COUNT(*) AS requests, SUM(CASE WHEN cache_hit = TRUE THEN 1 ELSE 0 END) AS cache_hits, AVG(response_time_ms) AS average_response_time FROM request_logs GROUP BY thread_id ORDER BY requests DESC",
        [],
      ),
    });
  } catch {
    res.status(503).json({ error: "Analytics database unavailable." });
  }
});
app.get("/api/analytics/cache", requireSession, async (req, res) => {
  if (!(await requireDatabase(res))) return;
  try {
    res.json({
      rows: await db(
        "SELECT url, size_bytes, hit_count, last_accessed, created_at FROM cache_metadata ORDER BY last_accessed DESC",
        [],
      ),
    });
  } catch {
    res.status(503).json({ error: "Analytics database unavailable." });
  }
});
app.get("/api/analytics/timeline", requireSession, async (req, res) => {
  if (!(await requireDatabase(res))) return;
  try {
    res.json({
      rows: await db(
        "SELECT DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS minute, COUNT(*) AS requests FROM request_logs GROUP BY minute ORDER BY minute",
        [],
      ),
    });
  } catch {
    res.status(503).json({ error: "Analytics database unavailable." });
  }
});

function fetchThroughProxy(target) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: proxyHost, port: proxyPort });
    const chunks = [];
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error("Proxy request timed out."));
    }, 15000);
    socket.on("connect", () =>
      socket.write(
        `GET ${target.pathname}${target.search} HTTP/1.0\r\nHost: ${target.hostname}\r\nConnection: close\r\n\r\n`,
      ),
    );
    socket.on("data", (chunk) => chunks.push(chunk));
    socket.on("end", () => {
      clearTimeout(timer);
      const response = Buffer.concat(chunks);
      const split = response.indexOf("\r\n\r\n");
      const header = response.subarray(0, split).toString();
      resolve({
        status: Number(header.match(/^HTTP\/\S+ (\d+)/)?.[1] || 502),
        contentType:
          header.match(/\r\ncontent-type:\s*([^\r\n]+)/i)?.[1] || "text/plain",
        body: response.subarray(split + 4),
      });
    });
    socket.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}
app.post("/api/proxy/search", requireSession, async (req, res) => {
  let target;
  try {
    target = new URL(req.body?.url);
  } catch {
    return res
      .status(400)
      .json({ error: "Please enter a valid HTTP or HTTPS URL." });
  }
  if (target.protocol !== "http:")
    return res.status(400).json({
      error:
        "The current C proxy supports HTTP URLs only; HTTPS CONNECT is not implemented.",
    });
  try {
    const result = await fetchThroughProxy(target);
    res.json({
      url: target.toString(),
      status: result.status,
      contentType: result.contentType,
      response: result.body.toString("base64"),
    });
  } catch (error) {
    res.status(502).json({
      error: error.message.includes("timed out")
        ? error.message
        : "Unable to connect to the RELAY proxy.",
    });
  }
});
app.listen(port, () =>
  console.log(`Relay API listening on http://localhost:${port}`),
);
