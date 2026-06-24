# Production Deploy Guide

This app is now a Node.js production app:

- React/Vite frontend is built into `dist/`.
- `server/index.js` serves the frontend and backend API.
- Auth uses hashed passwords and `HttpOnly` signed cookies.
- Events, settings, and users are stored as JSON files under `DATA_DIR`.

## 1. Server Requirements

- Node.js 20 or newer.
- HTTPS reverse proxy such as Nginx/Caddy/Apache.
- A persistent private data directory outside the public web root.

## 2. Upload Files

Upload the project folder to your server, excluding:

- `node_modules/`
- `dist/` if you will build on the server
- `data/`
- `.env`
- log files

Then run:

```bash
npm install
npm run build
```

## 3. Environment Variables

Create a production environment file or set these variables in your process manager:

```bash
NODE_ENV=production
PORT=3000
AUTH_SECRET=replace-with-a-long-random-secret-at-least-32-chars
ADMIN_NAME=Administrator
ADMIN_EMAIL=owner@example.com
ADMIN_PASSWORD=replace-with-a-strong-initial-password
DATA_DIR=/var/lib/event-manager
SESSION_HOURS=8
```

Important:

- `AUTH_SECRET` must remain stable, otherwise existing sessions become invalid.
- `ADMIN_PASSWORD` is used only when `users.json` does not exist yet.
- Keep `DATA_DIR` private and backed up.

## 4. Start The App

Basic:

```bash
npm start
```

Recommended with PM2:

```bash
npm install -g pm2
pm2 start server/index.js --name event-manager
pm2 save
pm2 startup
```

With environment file:

```bash
pm2 start server/index.js --name event-manager --env production
```

Or create an `ecosystem.config.cjs` if your host supports PM2 config.

## 5. Nginx Reverse Proxy

Example:

```nginx
server {
  server_name event.example.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  listen 443 ssl http2;
  ssl_certificate /etc/letsencrypt/live/event.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/event.example.com/privkey.pem;
}
```

Redirect HTTP to HTTPS:

```nginx
server {
  listen 80;
  server_name event.example.com;
  return 301 https://$host$request_uri;
}
```

## 6. First Login

Open your domain and login with:

- Email: value of `ADMIN_EMAIL`
- Password: value of `ADMIN_PASSWORD`

Then create named admin/member users from `Pengaturan`.

## 7. Backup

Back up `DATA_DIR` regularly. It contains:

- `users.json`
- `events.json`
- `settings.json`

## 8. Health Check

Use:

```bash
curl -i https://event.example.com/api/auth/session
```

Expected response before login:

```json
{"session":null}
```
