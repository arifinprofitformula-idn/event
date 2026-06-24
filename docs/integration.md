# Integration Notes

The UI reads and writes data through repository-style services.

Current runtime:

- `eventRepository` uses `localStorage`.
- `settingsRepository` uses `localStorage`.
- `createEventService()` exposes event operations such as upsert and delete.

Future backend/API integration:

1. Create an HTTP repository with `createHttpRepository`.
2. Pass it to `createEventService(repository)`.
3. Keep page components unchanged.

Example:

```js
import { createHttpRepository } from "./services/httpRepository.js";
import { createEventService } from "./services/eventService.js";

const eventApiRepository = createHttpRepository({
  baseUrl: "https://api.example.com",
  resource: "/events",
  fallbackValue: []
});

const eventService = createEventService(eventApiRepository);
```

Expected event API shape:

- `GET /events` returns an array of event objects.
- `PUT /events` accepts the full event array and returns the saved array.

For Google Sheets, use the same repository contract and map rows to the event schema in `model.js`.

## Production Backend

Auth is handled by the Node server in `server/index.js`.

Security behavior:

- Passwords are stored as `scrypt` hashes.
- Sessions are signed server-side tokens stored in an `HttpOnly` cookie.
- Admin-only user management is enforced by `/api/users`.
- Login has basic IP rate limiting.
- Production requires `AUTH_SECRET`.
- First production boot requires `ADMIN_PASSWORD`.
- Event and settings data are now stored through backend APIs.

Production environment example:

```bash
NODE_ENV=production
PORT=3000
AUTH_SECRET=replace-with-a-long-random-secret
ADMIN_EMAIL=owner@example.com
ADMIN_PASSWORD=replace-with-a-strong-initial-password
DATA_DIR=/secure/path/event-manager-data
SESSION_HOURS=8
```

Run:

```bash
npm run build
npm start
```

Important:

- Put the app behind HTTPS. The server marks cookies as `Secure` in `NODE_ENV=production`.
- Keep `DATA_DIR` outside the public web root.
- Rotate the initial admin password after first login by creating a new admin or updating users through the API/UI.
- Read [deploy-production.md](./deploy-production.md) for live server steps.
