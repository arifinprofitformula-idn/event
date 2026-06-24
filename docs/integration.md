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

For shared hosting, auth and data APIs are handled by PHP in `api/index.php`.

Security behavior:

- Passwords are stored as `scrypt` hashes.
- Sessions use PHP server-side sessions with an `HttpOnly` cookie.
- Admin-only user management is enforced by `/api/users`.
- Login has basic IP rate limiting.
- First production boot uses `admin_password` from `api/config.php`.
- Users, events, and settings are stored in MySQL.

Production config example:

```php
<?php
return [
    'db' => [
        'host' => 'localhost',
        'port' => 3306,
        'name' => 'cpaneluser_event_manager',
        'user' => 'cpaneluser_event_user',
        'password' => 'your_mysql_password',
        'charset' => 'utf8mb4',
    ],
    'app' => [
        'admin_name' => 'Administrator',
        'admin_email' => 'owner@example.com',
        'admin_password' => 'replace-with-a-strong-initial-password',
        'session_name' => 'em_session',
        'cookie_secure' => true,
    ],
];
```

Run:

```bash
npm run release
```

Important:

- Use HTTPS and keep `cookie_secure` set to `true`.
- Create a MySQL database and user before first boot.
- Rotate the initial admin password after first login by creating a new admin or updating users through the API/UI.
- Read [deploy-production.md](./deploy-production.md) for live server steps.
