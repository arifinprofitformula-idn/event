# Event Manager

Production-ready event management app with:

- React/Vite frontend
- Node.js backend
- MySQL database storage
- `HttpOnly` cookie authentication
- Hashed user passwords
- Backend APIs for users, events, and settings

## Local Production Run

```bash
npm install
npm run build
npm start
```

Open:

```text
http://127.0.0.1:3000
```

Development default admin:

- Email: `admin@event.local`
- Password: `admin123`

For real production, set environment variables from `.env.example` and read:

- `docs/deploy-production.md`
- `docs/integration.md`
# event
