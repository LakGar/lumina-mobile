# Backend API Routes Reference

Complete list of API routes for the Lumina mobile app, with request/response shapes and variables.  
_Auth: All routes (except webhooks) expect an authenticated session (e.g. Clerk)._

---

## Journals

| Method | Path                 | Purpose              |
| ------ | -------------------- | -------------------- |
| GET    | `/api/journals`      | List user's journals |
| POST   | `/api/journals`      | Create journal       |
| GET    | `/api/journals/[id]` | Get one journal      |
| PATCH  | `/api/journals/[id]` | Update journal       |
| DELETE | `/api/journals/[id]` | Delete journal       |

### GET `/api/journals`

**Purpose:** List all journals for the current user.

**Request**

- **Headers:** `Authorization` (Bearer token or session cookie).
- **Query:** none.

**Response:** `200 OK`

```json
{
  "journals": [
    {
      "id": "string",
      "title": "string",
      "description": "string | null",
      "public": "boolean",
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)",
      "entryCount": "number (optional)"
    }
  ]
}
```

---

### POST `/api/journals`

**Purpose:** Create a new journal.

**Request**

- **Headers:** `Authorization`, `Content-Type: application/json`.
- **Body:**

```json
{
  "title": "string (required)"
}
```

_Note: App also has optional `description`; add to body if backend supports it._

**Response:** `201 Created`

```json
{
  "id": "string",
  "title": "string",
  "description": "string | null",
  "public": "boolean",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

---

### GET `/api/journals/[id]`

**Purpose:** Get a single journal by ID.

**Request**

- **Path:** `id` — journal ID.
- **Headers:** `Authorization`.

**Response:** `200 OK`

```json
{
  "id": "string",
  "title": "string",
  "description": "string | null",
  "public": "boolean",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)",
  "entryCount": "number (optional)"
}
```

**Errors:** `404` if journal not found or not owned by user.

---

### PATCH `/api/journals/[id]`

**Purpose:** Update a journal.

**Request**

- **Path:** `id` — journal ID.
- **Headers:** `Authorization`, `Content-Type: application/json`.
- **Body:** (all optional)

```json
{
  "title": "string",
  "public": "boolean"
}
```

**Response:** `200 OK` — same shape as GET one journal.

**Errors:** `404` if not found / not owned.

---

### DELETE `/api/journals/[id]`

**Purpose:** Delete a journal (and typically its entries).

**Request**

- **Path:** `id` — journal ID.
- **Headers:** `Authorization`.

**Response:** `204 No Content` or `200 OK` with `{ "ok": true }`.

**Errors:** `404` if not found / not owned.

---

## Journal entries (by journal)

| Method | Path                         | Purpose                    |
| ------ | ---------------------------- | -------------------------- |
| GET    | `/api/journals/[id]/entries` | List entries for a journal |
| POST   | `/api/journals/[id]/entries` | Create entry in journal    |

### GET `/api/journals/[id]/entries`

**Purpose:** List entries for a journal (optionally with sort/pagination).

**Request**

- **Path:** `id` — journal ID.
- **Headers:** `Authorization`.
- **Query (optional):**
  - `sort`: `"newest"` | `"oldest"` | `"lastEdited"` (if supported).
  - `limit`: number.
  - `offset` or `cursor`: for pagination.

**Response:** `200 OK`

```json
{
  "entries": [
    {
      "id": "string",
      "journalId": "string",
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)",
      "title": "string | null",
      "content": "string (HTML or plain text)",
      "source": "string | null (e.g. prompt used)",
      "mood": "string | null",
      "tags": "string[]",
      "images": "string[] (optional)"
    }
  ],
  "total": "number (optional)"
}
```

---

### POST `/api/journals/[id]/entries`

**Purpose:** Create a new entry in a journal.

**Request**

- **Path:** `id` — journal ID.
- **Headers:** `Authorization`, `Content-Type: application/json`.
- **Body:**

```json
{
  "content": "string (required)",
  "source": "string (optional)",
  "title": "string (optional)",
  "mood": "string (optional)",
  "tags": "string[] (optional)"
}
```

**Response:** `201 Created`

```json
{
  "id": "string",
  "journalId": "string",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)",
  "title": "string | null",
  "content": "string",
  "source": "string | null",
  "mood": "string | null",
  "tags": "string[]",
  "images": "string[] (optional)"
}
```

**Errors:** `404` if journal not found.

---

## Entries (by entry ID)

| Method | Path                              | Purpose                  |
| ------ | --------------------------------- | ------------------------ |
| GET    | `/api/entries/[id]`               | Get one entry            |
| PATCH  | `/api/entries/[id]`               | Update entry             |
| DELETE | `/api/entries/[id]`               | Delete entry             |
| PUT    | `/api/entries/[id]/mood`          | Set/update entry mood    |
| POST   | `/api/entries/[id]/tags`          | Add tag                  |
| DELETE | `/api/entries/[id]/tags/[tag]`    | Remove tag               |
| POST   | `/api/entries/[id]/regenerate-ai` | Regenerate AI (stub 501) |

### GET `/api/entries/[id]`

**Purpose:** Get a single entry by ID.

**Request**

- **Path:** `id` — entry ID.
- **Headers:** `Authorization`.

**Response:** `200 OK`

```json
{
  "id": "string",
  "journalId": "string",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)",
  "title": "string | null",
  "content": "string",
  "source": "string | null",
  "mood": "string | null",
  "tags": "string[]",
  "images": "string[] (optional)"
}
```

**Errors:** `404` if not found or no access.

---

### PATCH `/api/entries/[id]`

**Purpose:** Update an entry (e.g. content, title).

**Request**

- **Path:** `id` — entry ID.
- **Headers:** `Authorization`, `Content-Type: application/json`.
- **Body:** (all optional)

```json
{
  "content": "string",
  "title": "string",
  "mood": "string",
  "tags": "string[]",
  "images": "string[]"
}
```

**Response:** `200 OK` — same shape as GET one entry.

**Errors:** `404` if not found.

---

### DELETE `/api/entries/[id]`

**Purpose:** Delete an entry.

**Request**

- **Path:** `id` — entry ID.
- **Headers:** `Authorization`.

**Response:** `204 No Content` or `200 OK` with `{ "ok": true }`.

**Errors:** `404` if not found.

---

### PUT `/api/entries/[id]/mood`

**Purpose:** Set or update the mood for an entry.

**Request**

- **Path:** `id` — entry ID.
- **Headers:** `Authorization`, `Content-Type: application/json`.
- **Body:**

```json
{
  "label": "string (e.g. calm, energized, grateful)"
}
```

**Response:** `200 OK`

```json
{
  "id": "string",
  "mood": "string"
}
```

**Errors:** `404` if entry not found.

---

### POST `/api/entries/[id]/tags`

**Purpose:** Add a tag to an entry.

**Request**

- **Path:** `id` — entry ID.
- **Headers:** `Authorization`, `Content-Type: application/json`.
- **Body:**

```json
{
  "tag": "string (required)"
}
```

**Response:** `200 OK` or `201 Created`

```json
{
  "tags": "string[]"
}
```

**Errors:** `404` if entry not found; `400` if tag invalid/duplicate.

---

### DELETE `/api/entries/[id]/tags/[tag]`

**Purpose:** Remove a tag from an entry.

**Request**

- **Path:** `id` — entry ID, `tag` — tag string (URL-encoded if needed).
- **Headers:** `Authorization`.

**Response:** `204 No Content` or `200 OK` with updated `tags`.

**Errors:** `404` if entry or tag not found.

---

### POST `/api/entries/[id]/regenerate-ai`

**Purpose:** Regenerate AI content for an entry. Currently a stub.

**Request**

- **Path:** `id` — entry ID.
- **Headers:** `Authorization`, optional `Content-Type: application/json`.
- **Body:** optional (e.g. prompt or options).

**Response:** `501 Not Implemented` (stub).

---

## Current user

| Method | Path                         | Purpose                                   |
| ------ | ---------------------------- | ----------------------------------------- |
| GET    | `/api/users/me/entries`      | List user's recent entries (rate limited) |
| GET    | `/api/users/me/preferences`  | Get preferences                           |
| PATCH  | `/api/users/me/preferences`  | Update preferences                        |
| GET    | `/api/users/me/notification` | Get notification settings                 |
| PATCH  | `/api/users/me/notification` | Update notification settings              |

### GET `/api/users/me/entries`

**Purpose:** List the current user's recent entries across all journals (e.g. for home feed or calendar).

**Request**

- **Headers:** `Authorization`.
- **Query:**
  - `limit`: number (e.g. 20, 50) — required or has a default; rate limited.

**Response:** `200 OK`

```json
{
  "entries": [
    {
      "id": "string",
      "journalId": "string",
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)",
      "title": "string | null",
      "content": "string",
      "mood": "string | null",
      "tags": "string[]"
    }
  ]
}
```

---

### GET `/api/users/me/preferences`

**Purpose:** Get user preferences (theme, goal, topics, etc.).

**Request**

- **Headers:** `Authorization`.

**Response:** `200 OK`

```json
{
  "theme": "light | dark | system",
  "goal": "string | null",
  "topics": "string[]",
  "reason": "string | null",
  "defaultJournalId": "string | null (optional, for app)"
}
```

---

### PATCH `/api/users/me/preferences`

**Purpose:** Update user preferences.

**Request**

- **Headers:** `Authorization`, `Content-Type: application/json`.
- **Body:** (all optional)

```json
{
  "theme": "light | dark | system",
  "goal": "string",
  "topics": "string[]",
  "reason": "string",
  "defaultJournalId": "string"
}
```

**Response:** `200 OK` — same shape as GET preferences.

---

### GET `/api/users/me/notification`

**Purpose:** Get notification/reminder settings.

**Request**

- **Headers:** `Authorization`.

**Response:** `200 OK`

```json
{
  "dailyReminderEnabled": "boolean",
  "dailyReminderTime": "string (e.g. HH:mm)",
  "timezone": "string (IANA)",
  "frequency": "string (e.g. daily | weekly)",
  "emailReminders": "boolean (optional)",
  "promptsAndTips": "boolean (optional)"
}
```

---

### PATCH `/api/users/me/notification`

**Purpose:** Update notification settings.

**Request**

- **Headers:** `Authorization`, `Content-Type: application/json`.
- **Body:** (all optional)

```json
{
  "dailyReminderEnabled": "boolean",
  "dailyReminderTime": "string (HH:mm)",
  "timezone": "string (IANA)",
  "frequency": "string"
}
```

**Response:** `200 OK` — same shape as GET notification.

---

## Billing (Stripe)

| Method | Path                    | Purpose                               |
| ------ | ----------------------- | ------------------------------------- |
| POST   | `/api/billing/checkout` | Create Stripe Checkout Session        |
| POST   | `/api/billing/portal`   | Create Stripe Customer Portal session |

### POST `/api/billing/checkout`

**Purpose:** Create a Stripe Checkout Session for subscription or one-time purchase.

**Request**

- **Headers:** `Authorization`, `Content-Type: application/json`.
- **Body:** (depends on backend)

```json
{
  "priceId": "string (optional)",
  "successUrl": "string (optional)",
  "cancelUrl": "string (optional)"
}
```

**Response:** `200 OK`

```json
{
  "url": "string (Stripe Checkout URL)",
  "sessionId": "string (optional)"
}
```

---

### POST `/api/billing/portal`

**Purpose:** Create a Stripe Customer Portal session (manage subscription, payment methods).

**Request**

- **Headers:** `Authorization`, `Content-Type: application/json`.
- **Body:** (optional)

```json
{
  "returnUrl": "string (optional)"
}
```

**Response:** `200 OK`

```json
{
  "url": "string (Stripe Portal URL)"
}
```

---

## Moods (standalone mood logs)

| Method | Path              | Purpose               |
| ------ | ----------------- | --------------------- |
| GET    | `/api/moods`      | List user's mood logs |
| POST   | `/api/moods`      | Create mood log       |
| GET    | `/api/moods/[id]` | Get one mood          |
| PATCH  | `/api/moods/[id]` | Update mood           |
| DELETE | `/api/moods/[id]` | Delete mood           |

### GET `/api/moods`

**Purpose:** List mood logs for the current user.

**Request**

- **Headers:** `Authorization`.
- **Query (optional):** `limit`, `offset`, date range if supported.

**Response:** `200 OK`

```json
{
  "moods": [
    {
      "id": "string",
      "title": "string",
      "note": "string | null",
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)"
    }
  ]
}
```

---

### POST `/api/moods`

**Purpose:** Create a mood log.

**Request**

- **Headers:** `Authorization`, `Content-Type: application/json`.
- **Body:**

```json
{
  "title": "string (required)",
  "note": "string (optional)"
}
```

**Response:** `201 Created`

```json
{
  "id": "string",
  "title": "string",
  "note": "string | null",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

---

### GET `/api/moods/[id]`

**Purpose:** Get one mood log.

**Request**

- **Path:** `id` — mood ID.
- **Headers:** `Authorization`.

**Response:** `200 OK` — single mood object (same shape as in list).

**Errors:** `404` if not found.

---

### PATCH `/api/moods/[id]`

**Purpose:** Update a mood log.

**Request**

- **Path:** `id` — mood ID.
- **Headers:** `Authorization`, `Content-Type: application/json`.
- **Body:** (optional)

```json
{
  "title": "string",
  "note": "string"
}
```

**Response:** `200 OK` — updated mood object.

---

### DELETE `/api/moods/[id]`

**Purpose:** Delete a mood log.

**Request**

- **Path:** `id` — mood ID.
- **Headers:** `Authorization`.

**Response:** `204 No Content` or `200 OK` with `{ "ok": true }`.

---

## Onboarding

| Method | Path                    | Purpose             |
| ------ | ----------------------- | ------------------- |
| POST   | `/api/onboard/complete` | Complete onboarding |

### POST `/api/onboard/complete`

**Purpose:** Mark onboarding complete and optionally create initial journal, first entry, preferences, and notification settings.

**Request**

- **Headers:** `Authorization`, `Content-Type: application/json`.
- **Body:** (all optional, depends on flow)

```json
{
  "journal": {
    "title": "string"
  },
  "firstEntry": {
    "content": "string",
    "source": "string"
  },
  "preferences": {
    "theme": "string",
    "goal": "string",
    "topics": "string[]",
    "reason": "string"
  },
  "notification": {
    "dailyReminderEnabled": "boolean",
    "dailyReminderTime": "string",
    "timezone": "string",
    "frequency": "string"
  },
  "onboardingComplete": "boolean"
}
```

**Response:** `200 OK` or `201 Created`

```json
{
  "onboardingComplete": "boolean",
  "journal": { "id": "string", "title": "string" },
  "entry": { "id": "string" }
}
```

(Exact shape depends on backend.)

---

## Webhooks

| Method | Path                   | Purpose                              |
| ------ | ---------------------- | ------------------------------------ |
| POST   | `/api/webhooks/stripe` | Stripe webhook (subscription events) |

### POST `/api/webhooks/stripe`

**Purpose:** Receive Stripe events (e.g. subscription created/updated/canceled). Not called by the mobile app directly; Stripe sends requests to this URL.

**Request**

- **Headers:** `Stripe-Signature` (verification), raw body for signature check.
- **Body:** Stripe event payload (JSON).

**Response:** `200 OK` (acknowledge receipt). Return 4xx on verification failure.

---

## Optional / future routes (from app usage)

These are not in the backend list you provided but the app UI suggests they may be useful:

| Method | Path                           | Purpose                                                           |
| ------ | ------------------------------ | ----------------------------------------------------------------- |
| POST   | `/api/gift-invites` or similar | Send gift membership invite by email (see Gift membership screen) |

**Gift invite (if added)**

- **Request body:** `{ "email": "string" }`.
- **Response:** e.g. `201` with `{ "id": "string", "email": "string", "status": "pending" }`.

---

## Summary table (all routes)

| Method | Path                              |
| ------ | --------------------------------- |
| GET    | `/api/journals`                   |
| POST   | `/api/journals`                   |
| GET    | `/api/journals/[id]`              |
| PATCH  | `/api/journals/[id]`              |
| DELETE | `/api/journals/[id]`              |
| GET    | `/api/journals/[id]/entries`      |
| POST   | `/api/journals/[id]/entries`      |
| GET    | `/api/entries/[id]`               |
| PATCH  | `/api/entries/[id]`               |
| DELETE | `/api/entries/[id]`               |
| PUT    | `/api/entries/[id]/mood`          |
| POST   | `/api/entries/[id]/tags`          |
| DELETE | `/api/entries/[id]/tags/[tag]`    |
| POST   | `/api/entries/[id]/regenerate-ai` |
| GET    | `/api/users/me/entries`           |
| GET    | `/api/users/me/preferences`       |
| PATCH  | `/api/users/me/preferences`       |
| GET    | `/api/users/me/notification`      |
| PATCH  | `/api/users/me/notification`      |
| POST   | `/api/billing/checkout`           |
| POST   | `/api/billing/portal`             |
| GET    | `/api/moods`                      |
| POST   | `/api/moods`                      |
| GET    | `/api/moods/[id]`                 |
| PATCH  | `/api/moods/[id]`                 |
| DELETE | `/api/moods/[id]`                 |
| POST   | `/api/onboard/complete`           |
| POST   | `/api/webhooks/stripe`            |

All of the above (except the optional gift invite and the Stripe webhook) are what you need for the current backend. The app currently uses mock data; when you wire it to the API, use this doc for request/response and variables.
