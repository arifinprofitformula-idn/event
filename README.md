# Event Manager

Production-ready event management app with:

- React/Vite frontend
- PHP/MySQL backend for shared hosting
- `HttpOnly` PHP session authentication
- Hashed user passwords
- Backend APIs for users, events, and settings

## Build Shared Hosting Release

```bash
npm install
npm run release
```

Upload the contents of:

```text
release/
```

to your cPanel subdomain document root.

Then copy `api/config.example.php` to `api/config.php` on the server and set MySQL credentials.

Read:

- `docs/deploy-production.md`
- `docs/integration.md`
# event
