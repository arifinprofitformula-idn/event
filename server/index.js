import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = resolve(__dirname, "..");
const distDir = resolve(rootDir, "dist");

const loadDotEnv = () => {
  const envPath = join(rootDir, ".env");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (process.env[key]) continue;
    process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
  }
};

loadDotEnv();

const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";
const authSecret = process.env.AUTH_SECRET || "dev-only-change-this-secret";
const sessionHours = Number(process.env.SESSION_HOURS || 8);

if (isProduction && authSecret === "dev-only-change-this-secret") {
  throw new Error("AUTH_SECRET must be set in production.");
}

const dbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "event_manager",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  charset: "utf8mb4"
};

if (process.env.DB_SSL === "true") {
  dbConfig.ssl = { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" };
}

const db = mysql.createPool(dbConfig);

const defaultSettings = {
  members: ["Coach Arifin", "Marcom Lead", "Marcom Content", "Marcom Ops", "Operator Zoom", "Product Team"],
  brands: ["EPIC Hub", "GOLDGRAM", "MEEZAN GOLD", "SILVERGRAM"],
  ytChannels: {
    "EPIC Hub": "",
    GOLDGRAM: "",
    "MEEZAN GOLD": "",
    SILVERGRAM: ""
  }
};

const securityHeaders = () => ({
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cache-Control": "no-store"
});

const json = (res, status, body, extraHeaders = {}) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    ...securityHeaders(),
    ...extraHeaders
  });
  res.end(JSON.stringify(body));
};

const toIso = (value) => value ? new Date(value).toISOString() : undefined;

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  active: Boolean(user.active),
  createdAt: toIso(user.created_at || user.createdAt),
  updatedAt: toIso(user.updated_at || user.updatedAt)
});

const readJsonBody = (req) => new Promise((resolveBody, reject) => {
  let raw = "";
  req.on("data", (chunk) => {
    raw += chunk;
    if (raw.length > 1024 * 1024) {
      reject(new Error("Payload too large"));
      req.destroy();
    }
  });
  req.on("end", () => {
    try {
      resolveBody(raw ? JSON.parse(raw) : {});
    } catch {
      reject(new Error("Invalid JSON"));
    }
  });
});

const base64url = (input) => Buffer.from(input).toString("base64url");
const sign = (value) => createHmac("sha256", authSecret).update(value).digest("base64url");

const createToken = (session) => {
  const payload = base64url(JSON.stringify({
    ...session,
    exp: Date.now() + sessionHours * 60 * 60 * 1000
  }));
  return `${payload}.${sign(payload)}`;
};

const verifyToken = (token) => {
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  if (sign(payload) !== signature) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!session.exp || Date.now() > session.exp) return null;
    return session;
  } catch {
    return null;
  }
};

const parseCookies = (req) => Object.fromEntries((req.headers.cookie || "")
  .split(";")
  .filter(Boolean)
  .map((part) => {
    const [key, ...value] = part.trim().split("=");
    return [key, decodeURIComponent(value.join("="))];
  }));

const sessionCookie = (token) => {
  const secure = isProduction ? "; Secure" : "";
  return `em_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${sessionHours * 60 * 60}${secure}`;
};

const clearSessionCookie = () => "em_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0";

const hashPassword = (password) => {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt:${salt}:${hash}`;
};

const verifyPassword = (password, passwordHash) => {
  const [scheme, salt, hash] = String(passwordHash || "").split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const actual = Buffer.from(scryptSync(password, salt, 64).toString("base64url"));
  const expected = Buffer.from(hash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

const getUserById = async (id) => {
  const [rows] = await db.execute("SELECT * FROM em_users WHERE id = ? LIMIT 1", [id]);
  return rows[0] || null;
};

const getUserByEmail = async (email) => {
  const [rows] = await db.execute("SELECT * FROM em_users WHERE email = ? LIMIT 1", [email]);
  return rows[0] || null;
};

const loadAppData = async (key, fallbackValue) => {
  const [rows] = await db.execute("SELECT data_json FROM em_app_data WHERE data_key = ? LIMIT 1", [key]);
  if (!rows[0]) {
    await saveAppData(key, fallbackValue);
    return fallbackValue;
  }
  return JSON.parse(rows[0].data_json);
};

const saveAppData = async (key, value) => {
  await db.execute(
    `INSERT INTO em_app_data (data_key, data_json, updated_at)
     VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
    [key, JSON.stringify(value)]
  );
};

const currentSession = async (req) => {
  const session = verifyToken(parseCookies(req).em_session);
  if (!session) return null;
  const user = await getUserById(session.userId);
  if (!user || !user.active) return null;
  return { ...publicUser(user), loginAt: session.loginAt };
};

const requireAuth = async (req, res) => {
  const session = await currentSession(req);
  if (!session) {
    json(res, 401, { message: "Unauthorized" });
    return null;
  }
  return session;
};

const requireAdmin = async (req, res) => {
  const session = await requireAuth(req, res);
  if (!session) return null;
  if (session.role !== "admin") {
    json(res, 403, { message: "Forbidden" });
    return null;
  }
  return session;
};

const loginAttempts = new Map();
const isRateLimited = (key) => {
  const now = Date.now();
  const attempts = (loginAttempts.get(key) || []).filter((time) => now - time < 15 * 60 * 1000);
  attempts.push(now);
  loginAttempts.set(key, attempts);
  return attempts.length > 10;
};

const validatePassword = (password) => typeof password === "string" && password.length >= 8;
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));

const initDatabase = async () => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS em_users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(160) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin', 'member') NOT NULL DEFAULT 'member',
      active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_em_users_active (active),
      INDEX idx_em_users_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS em_app_data (
      data_key VARCHAR(64) PRIMARY KEY,
      data_json LONGTEXT NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [[userCount]] = await db.query("SELECT COUNT(*) AS total FROM em_users");
  if (Number(userCount.total) === 0) {
    const adminPassword = process.env.ADMIN_PASSWORD || (isProduction ? null : "admin123");
    if (!adminPassword) throw new Error("ADMIN_PASSWORD must be set for first production boot.");
    await db.execute(
      `INSERT INTO em_users (id, name, email, password_hash, role, active, created_at)
       VALUES (?, ?, ?, ?, 'admin', 1, NOW())`,
      [
        randomBytes(16).toString("hex"),
        process.env.ADMIN_NAME || "Administrator",
        (process.env.ADMIN_EMAIL || "admin@event.local").toLowerCase(),
        hashPassword(adminPassword)
      ]
    );
  }

  await loadAppData("events", []);
  await loadAppData("settings", defaultSettings);
};

const handleApi = async (req, res, url) => {
  if (req.method === "GET" && url.pathname === "/api/auth/session") {
    return json(res, 200, { session: await currentSession(req) });
  }

  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    if (isRateLimited(String(ip))) return json(res, 429, { message: "Terlalu banyak percobaan login." });

    const body = await readJsonBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const user = await getUserByEmail(email);

    if (!user || !user.active || !verifyPassword(password, user.password_hash)) {
      return json(res, 401, { message: "Email atau password tidak sesuai." });
    }

    const session = {
      userId: user.id,
      email: user.email,
      role: user.role,
      loginAt: new Date().toISOString()
    };
    return json(res, 200, { session: { ...publicUser(user), loginAt: session.loginAt } }, {
      "Set-Cookie": sessionCookie(createToken(session))
    });
  }

  if (req.method === "POST" && url.pathname === "/api/auth/logout") {
    return json(res, 200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
  }

  if (req.method === "GET" && url.pathname === "/api/users") {
    if (!await requireAdmin(req, res)) return;
    const [users] = await db.execute("SELECT * FROM em_users ORDER BY created_at ASC");
    return json(res, 200, { users: users.map(publicUser) });
  }

  if (req.method === "POST" && url.pathname === "/api/users") {
    if (!await requireAdmin(req, res)) return;
    const body = await readJsonBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!body.name || !validateEmail(email) || !validatePassword(password)) {
      return json(res, 400, { message: "Nama, email valid, dan password minimal 8 karakter wajib diisi." });
    }

    if (await getUserByEmail(email)) return json(res, 409, { message: "Email sudah terdaftar." });

    const user = {
      id: randomBytes(16).toString("hex"),
      name: String(body.name).trim(),
      email,
      role: body.role === "admin" ? "admin" : "member",
      active: true
    };
    await db.execute(
      `INSERT INTO em_users (id, name, email, password_hash, role, active, created_at)
       VALUES (?, ?, ?, ?, ?, 1, NOW())`,
      [user.id, user.name, user.email, hashPassword(password), user.role]
    );
    return json(res, 201, { user: publicUser(user) });
  }

  const userMatch = url.pathname.match(/^\/api\/users\/([^/]+)$/);
  if (userMatch && req.method === "PATCH") {
    const session = await requireAdmin(req, res);
    if (!session) return;
    const body = await readJsonBody(req);
    const user = await getUserById(userMatch[1]);
    if (!user) return json(res, 404, { message: "User tidak ditemukan." });

    if (body.email && !validateEmail(body.email)) return json(res, 400, { message: "Email tidak valid." });
    if (body.password && !validatePassword(body.password)) return json(res, 400, { message: "Password minimal 8 karakter." });
    if (body.email) {
      const existing = await getUserByEmail(String(body.email).trim().toLowerCase());
      if (existing && existing.id !== user.id) return json(res, 409, { message: "Email sudah terdaftar." });
    }

    const patch = {
      name: body.name !== undefined ? String(body.name).trim() : user.name,
      email: body.email !== undefined ? String(body.email).trim().toLowerCase() : user.email,
      role: body.role !== undefined ? (body.role === "admin" ? "admin" : "member") : user.role,
      active: body.active !== undefined && user.id !== session.id ? Boolean(body.active) : Boolean(user.active),
      passwordHash: body.password ? hashPassword(String(body.password)) : user.password_hash
    };

    await db.execute(
      `UPDATE em_users
       SET name = ?, email = ?, role = ?, active = ?, password_hash = ?, updated_at = NOW()
       WHERE id = ?`,
      [patch.name, patch.email, patch.role, patch.active ? 1 : 0, patch.passwordHash, user.id]
    );
    return json(res, 200, { user: publicUser({ ...user, ...patch, password_hash: patch.passwordHash }) });
  }

  if (userMatch && req.method === "DELETE") {
    const session = await requireAdmin(req, res);
    if (!session) return;
    if (userMatch[1] === session.id) return json(res, 400, { message: "Tidak bisa menghapus user sendiri." });
    await db.execute("DELETE FROM em_users WHERE id = ?", [userMatch[1]]);
    return json(res, 200, { ok: true });
  }

  if (req.method === "GET" && url.pathname === "/api/events") {
    if (!await requireAuth(req, res)) return;
    return json(res, 200, { events: await loadAppData("events", []) });
  }

  if (req.method === "PUT" && url.pathname === "/api/events") {
    if (!await requireAuth(req, res)) return;
    const body = await readJsonBody(req);
    if (!Array.isArray(body.events)) return json(res, 400, { message: "events must be an array." });
    await saveAppData("events", body.events);
    return json(res, 200, { events: body.events });
  }

  if (req.method === "GET" && url.pathname === "/api/settings") {
    if (!await requireAuth(req, res)) return;
    return json(res, 200, { settings: await loadAppData("settings", defaultSettings) });
  }

  if (req.method === "PUT" && url.pathname === "/api/settings") {
    if (!await requireAuth(req, res)) return;
    const body = await readJsonBody(req);
    if (!body.settings || typeof body.settings !== "object") return json(res, 400, { message: "settings object is required." });
    await saveAppData("settings", body.settings);
    return json(res, 200, { settings: body.settings });
  }

  return json(res, 404, { message: "Not found" });
};

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

const serveStatic = (req, res, url) => {
  const requested = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  let filePath = resolve(distDir, requested.slice(1));
  if (!filePath.startsWith(distDir) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(distDir, "index.html");
  }
  res.writeHead(200, {
    ...securityHeaders(),
    "Cache-Control": filePath.endsWith("index.html") ? "no-store" : "public, max-age=31536000, immutable",
    "Content-Type": mime[extname(filePath)] || "application/octet-stream"
  });
  createReadStream(filePath).pipe(res);
};

await initDatabase();

createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
    return serveStatic(req, res, url);
  } catch (error) {
    return json(res, 500, { message: error.message || "Internal server error" });
  }
}).listen(port, () => {
  console.log(`Event Manager server listening on http://127.0.0.1:${port}`);
});
