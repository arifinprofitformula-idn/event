# Production Deploy Guide

This app is now a Node.js production app:

- React/Vite frontend is built into `dist/`.
- `server/index.js` serves the frontend and backend API.
- Auth uses hashed passwords and `HttpOnly` signed cookies.
- Events, settings, and users are stored in MySQL.

## 1. Server Requirements

- Node.js 20 or newer.
- MySQL 5.7+/8.0+ or MariaDB 10.3+.
- HTTPS reverse proxy such as Nginx/Caddy/Apache.
- For shared hosting, the hosting account must support Node.js apps. Static/PHP-only hosting is not enough.

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

If your shared hosting builds dependencies through cPanel Node.js App, upload the full project and run `npm install` from the Node app terminal.

## 3. MySQL Database

Create a MySQL database and user in cPanel or your hosting control panel.

Example values:

- Database: `cpaneluser_event_manager`
- User: `cpaneluser_event_user`
- Password: strong generated password
- Host: usually `localhost`

Give the user full privileges on the database.

The app creates tables automatically on first boot. If your host blocks `CREATE TABLE`, import:

```text
docs/mysql-schema.sql
```

## 4. Environment Variables

Create a production environment file or set these variables in your process manager:

```bash
NODE_ENV=production
PORT=3000
AUTH_SECRET=replace-with-a-long-random-secret-at-least-32-chars
ADMIN_NAME=Administrator
ADMIN_EMAIL=owner@example.com
ADMIN_PASSWORD=replace-with-a-strong-initial-password
SESSION_HOURS=8
DB_HOST=localhost
DB_PORT=3306
DB_USER=cpaneluser_event_user
DB_PASSWORD=your_mysql_password
DB_NAME=cpaneluser_event_manager
DB_CONNECTION_LIMIT=10
DB_SSL=false
```

Important:

- `AUTH_SECRET` must remain stable, otherwise existing sessions become invalid.
- `ADMIN_PASSWORD` is used only when the `em_users` table has no users yet.
- Do not commit real database credentials.
- Back up your MySQL database regularly.

## 5. Start The App

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

## 6. Shared Hosting / cPanel Node.js App

Typical setup:

1. Create a Node.js app in cPanel.
2. Set Application root to the uploaded project folder.
3. Set Application startup file to:

```text
server/index.js
```

4. Set environment variables from the section above.
5. Run `npm install`.
6. Run `npm run build`.
7. Restart the Node.js app.

If cPanel exposes an app URL like `/nodeapp`, configure the domain/subdomain document root or proxy to the Node.js app according to your hosting provider.

## 7. Nginx Reverse Proxy

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

## 8. First Login

Open your domain and login with:

- Email: value of `ADMIN_EMAIL`
- Password: value of `ADMIN_PASSWORD`

Then create named admin/member users from `Pengaturan`.

## 9. Backup

Back up the MySQL database regularly. It contains:

- `em_users`
- `em_app_data`

## 10. Health Check

Use:

```bash
curl -i https://event.example.com/api/auth/session
```

Expected response before login:

```json
{"session":null}
```
