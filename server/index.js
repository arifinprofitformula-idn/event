import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = resolve(__dirname, "..");
const distDir = resolve(rootDir, "dist");
const dataDir = resolve(process.env.DATA_DIR || join(rootDir, "data"));
const usersFile = join(dataDir, "users.json");
const eventsFile = join(dataDir, "events.json");
const settingsFile = join(dataDir, "settings.json");
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";
const authSecret = process.env.AUTH_SECRET || "dev-only-change-this-secret";
const sessionHours = Number(process.env.SESSION_HOURS || 8);

if (isProduction && authSecret === "dev-only-change-this-secret") {
  throw new Error("AUTH_SECRET must be set in production.");
}

mkdirSync(dataDir, { recursive: true });

const json = (res, status, body, extraHeaders = {}) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    ...securityHeaders(),
    ...extraHeaders
  });
  res.end(JSON.stringify(body));
};

const securityHeaders = () => ({
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cache-Control": "no-store"
});

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  active: user.active,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

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

const readDataFile = (file, fallbackValue) => {
  if (!existsSync(file)) writeFileSync(file, JSON.stringify(fallbackValue, null, 2));
  return JSON.parse(readFileSync(file, "utf8"));
};

const writeDataFile = (file, value) => {
  writeFileSync(file, JSON.stringify(value, null, 2));
};

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

const loadUsers = () => {
  if (!existsSync(usersFile)) {
    const adminPassword = process.env.ADMIN_PASSWORD || (isProduction ? null : "admin123");
    if (!adminPassword) throw new Error("ADMIN_PASSWORD must be set for first production boot.");
    const admin = {
      id: randomBytes(16).toString("hex"),
      name: process.env.ADMIN_NAME || "Administrator",
      email: (process.env.ADMIN_EMAIL || "admin@event.local").toLowerCase(),
      passwordHash: hashPassword(adminPassword),
      role: "admin",
      active: true,
      createdAt: new Date().toISOString()
    };
    writeFileSync(usersFile, JSON.stringify([admin], null, 2));
  }

  return JSON.parse(readFileSync(usersFile, "utf8"));
};

const saveUsers = (users) => {
  writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

const currentSession = (req) => {
  const session = verifyToken(parseCookies(req).em_session);
  if (!session) return null;
  const user = loadUsers().find((item) => item.id === session.userId && item.active);
  if (!user) return null;
  return { ...publicUser(user), loginAt: session.loginAt };
};

const requireAuth = (req, res) => {
  const session = currentSession(req);
  if (!session) {
    json(res, 401, { message: "Unauthorized" });
    return null;
  }
  return session;
};

const requireAdmin = (req, res) => {
  const session = requireAuth(req, res);
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

const handleApi = async (req, res, url) => {
  if (req.method === "GET" && url.pathname === "/api/auth/session") {
    return json(res, 200, { session: currentSession(req) });
  }

  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    if (isRateLimited(String(ip))) return json(res, 429, { message: "Terlalu banyak percobaan login." });

    const body = await readJsonBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const user = loadUsers().find((item) => item.active && item.email === email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
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
    if (!requireAdmin(req, res)) return;
    return json(res, 200, { users: loadUsers().map(publicUser) });
  }

  if (req.method === "POST" && url.pathname === "/api/users") {
    if (!requireAdmin(req, res)) return;
    const body = await readJsonBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!body.name || !validateEmail(email) || !validatePassword(password)) {
      return json(res, 400, { message: "Nama, email valid, dan password minimal 8 karakter wajib diisi." });
    }

    const users = loadUsers();
    if (users.some((user) => user.email === email)) return json(res, 409, { message: "Email sudah terdaftar." });

    const user = {
      id: randomBytes(16).toString("hex"),
      name: String(body.name).trim(),
      email,
      passwordHash: hashPassword(password),
      role: body.role === "admin" ? "admin" : "member",
      active: true,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    saveUsers(users);
    return json(res, 201, { user: publicUser(user) });
  }

  const userMatch = url.pathname.match(/^\/api\/users\/([^/]+)$/);
  if (userMatch && req.method === "PATCH") {
    const session = requireAdmin(req, res);
    if (!session) return;
    const body = await readJsonBody(req);
    const users = loadUsers();
    const user = users.find((item) => item.id === userMatch[1]);
    if (!user) return json(res, 404, { message: "User tidak ditemukan." });

    if (body.email && !validateEmail(body.email)) return json(res, 400, { message: "Email tidak valid." });
    if (body.password && !validatePassword(body.password)) return json(res, 400, { message: "Password minimal 8 karakter." });
    if (body.email && users.some((item) => item.id !== user.id && item.email === String(body.email).trim().toLowerCase())) {
      return json(res, 409, { message: "Email sudah terdaftar." });
    }

    if (body.name !== undefined) user.name = String(body.name).trim();
    if (body.email !== undefined) user.email = String(body.email).trim().toLowerCase();
    if (body.role !== undefined) user.role = body.role === "admin" ? "admin" : "member";
    if (body.active !== undefined && user.id !== session.id) user.active = Boolean(body.active);
    if (body.password) user.passwordHash = hashPassword(String(body.password));
    user.updatedAt = new Date().toISOString();
    saveUsers(users);
    return json(res, 200, { user: publicUser(user) });
  }

  if (userMatch && req.method === "DELETE") {
    const session = requireAdmin(req, res);
    if (!session) return;
    if (userMatch[1] === session.id) return json(res, 400, { message: "Tidak bisa menghapus user sendiri." });
    const users = loadUsers();
    saveUsers(users.filter((item) => item.id !== userMatch[1]));
    return json(res, 200, { ok: true });
  }

  if (req.method === "GET" && url.pathname === "/api/events") {
    if (!requireAuth(req, res)) return;
    return json(res, 200, { events: readDataFile(eventsFile, []) });
  }

  if (req.method === "PUT" && url.pathname === "/api/events") {
    if (!requireAuth(req, res)) return;
    const body = await readJsonBody(req);
    if (!Array.isArray(body.events)) return json(res, 400, { message: "events must be an array." });
    writeDataFile(eventsFile, body.events);
    return json(res, 200, { events: body.events });
  }

  if (req.method === "GET" && url.pathname === "/api/settings") {
    if (!requireAuth(req, res)) return;
    return json(res, 200, { settings: readDataFile(settingsFile, defaultSettings) });
  }

  if (req.method === "PUT" && url.pathname === "/api/settings") {
    if (!requireAuth(req, res)) return;
    const body = await readJsonBody(req);
    if (!body.settings || typeof body.settings !== "object") return json(res, 400, { message: "settings object is required." });
    writeDataFile(settingsFile, body.settings);
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
