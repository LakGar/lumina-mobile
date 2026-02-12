# API Testing Reference

This document lists every API route, its **source file**, **requirements**, **what to expect**, and the **URL to use during testing** (with the app running at `http://localhost:3000`).

**Base URL for testing:** `http://localhost:3000`

**Auth:** All routes below (except Stripe webhook) require an authenticated session (e.g. Clerk cookie or Bearer). Use the same browser/session where you’re signed in, or send cookies/headers from your client.

---

## Table of contents

1. [Journals](#journals)
2. [Journal entries](#journal-entries)
3. [Entries (by ID)](#entries-by-id)
4. [Current user](#current-user)
5. [Billing (Stripe)](#billing-stripe)
6. [Moods](#moods)
7. [Onboarding](#onboarding)
8. [Webhooks](#webhooks)

---

## Journals

### 1. List journals

| Item            | Value                                |
| --------------- | ------------------------------------ |
| **File**        | `app/api/journals/route.ts`          |
| **Method**      | `GET`                                |
| **Testing URL** | `http://localhost:3000/api/journals` |
| **Auth**        | Required                             |

**Requirement:** Returns all journals for the current user.

**What to expect:**

- **200 OK** — `{ "data": [ { "id": number, "title": string, "public": boolean, "createdAt": string, "updatedAt": string, "_count": { "entries": number }? } ] }`
- **401** — `{ "error": "Unauthorized" }` when not authenticated

---

### 2. Create journal

| Item            | Value                                |
| --------------- | ------------------------------------ |
| **File**        | `app/api/journals/route.ts`          |
| **Method**      | `POST`                               |
| **Testing URL** | `http://localhost:3000/api/journals` |
| **Auth**        | Required                             |

**Requirement:** Body must include `title` (string). Creates a journal for the current user.

**Request body:**

```json
{ "title": "My Journal" }
```

**What to expect:**

- **201 Created** — `{ "data": { "id": number, "title": string } }`
- **400** — `{ "error": "title is required" }` if title missing or empty
- **401** — Unauthorized

---

### 3. Get one journal

| Item            | Value                                                             |
| --------------- | ----------------------------------------------------------------- |
| **File**        | `app/api/journals/[id]/route.ts`                                  |
| **Method**      | `GET`                                                             |
| **Testing URL** | `http://localhost:3000/api/journals/1` (replace `1` with real ID) |
| **Auth**        | Required                                                          |

**Requirement:** Path param `id` = journal ID. Returns the journal only if owned by the user.

**What to expect:**

- **200 OK** — `{ "data": { "id": number, "title": string, "public": boolean } }`
- **400** — `{ "error": "Invalid journal id" }` for invalid ID
- **404** — `{ "error": "Journal not found" }` if not found or not owned
- **401** — Unauthorized

---

### 4. Update journal

| Item            | Value                                  |
| --------------- | -------------------------------------- |
| **File**        | `app/api/journals/[id]/route.ts`       |
| **Method**      | `PATCH`                                |
| **Testing URL** | `http://localhost:3000/api/journals/1` |
| **Auth**        | Required                               |

**Requirement:** Body may include `title` (string), `public` (boolean). Updates only if owned.

**Request body (all optional):**

```json
{ "title": "New Title", "public": false }
```

**What to expect:**

- **200 OK** — `{ "data": updated journal object }`
- **404** — Not found / not owned
- **401** — Unauthorized

---

### 5. Delete journal

| Item            | Value                                  |
| --------------- | -------------------------------------- |
| **File**        | `app/api/journals/[id]/route.ts`       |
| **Method**      | `DELETE`                               |
| **Testing URL** | `http://localhost:3000/api/journals/1` |
| **Auth**        | Required                               |

**Requirement:** Deletes the journal (and cascade: entries, etc.) if owned.

**What to expect:**

- **200 OK** — `{ "success": true }` or similar
- **404** — Not found / not owned
- **401** — Unauthorized

---

## Journal entries

### 6. List entries for a journal

| Item            | Value                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------- |
| **File**        | `app/api/journals/[id]/entries/route.ts`                                                           |
| **Method**      | `GET`                                                                                              |
| **Testing URL** | `http://localhost:3000/api/journals/1/entries`<br>Optional query: `?sort=newest&limit=20&offset=0` |
| **Auth**        | Required                                                                                           |

**Requirement:** Path `id` = journal ID. Optional query: `sort` (`newest` \| `oldest` \| `lastEdited`), `limit` (1–100, default 50), `offset` (default 0).

**What to expect:**

- **200 OK** — `{ "data": [ entry, ... ], "total": number }`  
  Each entry includes `summary`, `mood`, `tags`.
- **400** — Invalid journal id
- **404** — Journal not found or not owned
- **401** — Unauthorized

---

### 7. Create entry in journal

| Item            | Value                                          |
| --------------- | ---------------------------------------------- |
| **File**        | `app/api/journals/[id]/entries/route.ts`       |
| **Method**      | `POST`                                         |
| **Testing URL** | `http://localhost:3000/api/journals/1/entries` |
| **Auth**        | Required                                       |

**Requirement:** Body must include `content` (string). Optional: `source` (`TEXT` \| `VOICE` \| `MIXED`), `mood` (string), `tags` (string array).

**Request body:**

```json
{
  "content": "Today I felt calm.",
  "source": "TEXT",
  "mood": "Calm",
  "tags": ["daily", "reflection"]
}
```

**What to expect:**

- **201 Created** — `{ "data": entry }` with `summary`, `mood`, `tags` populated
- **400** — `{ "error": "content is required" }`
- **404** — Journal not found or not owned
- **401** — Unauthorized

---

## Entries (by ID)

### 8. Get one entry

| Item            | Value                                 |
| --------------- | ------------------------------------- |
| **File**        | `app/api/entries/[id]/route.ts`       |
| **Method**      | `GET`                                 |
| **Testing URL** | `http://localhost:3000/api/entries/1` |
| **Auth**        | Required                              |

**Requirement:** Path `id` = entry ID. Returns entry if its journal is owned by the user.

**What to expect:**

- **200 OK** — `{ "data": { id, journalId, content, source, createdAt, updatedAt, summary?, mood?, tags? } }`
- **400** — Invalid id
- **404** — Entry not found or not owned
- **401** — Unauthorized

---

### 9. Update entry

| Item            | Value                                 |
| --------------- | ------------------------------------- |
| **File**        | `app/api/entries/[id]/route.ts`       |
| **Method**      | `PATCH`                               |
| **Testing URL** | `http://localhost:3000/api/entries/1` |
| **Auth**        | Required                              |

**Requirement:** Body may include `content` (string), `source` (TEXT/VOICE/MIXED), `mood` (string), `tags` (string[]). Setting `tags` replaces all USER tags for that entry.

**Request body (all optional):**

```json
{
  "content": "Updated text",
  "mood": "Grateful",
  "tags": ["work", "growth"]
}
```

**What to expect:**

- **200 OK** — `{ "data": updated entry }`
- **404** — Not found or not owned
- **401** — Unauthorized

---

### 10. Delete entry

| Item            | Value                                 |
| --------------- | ------------------------------------- |
| **File**        | `app/api/entries/[id]/route.ts`       |
| **Method**      | `DELETE`                              |
| **Testing URL** | `http://localhost:3000/api/entries/1` |
| **Auth**        | Required                              |

**Requirement:** Deletes the entry if owned.

**What to expect:**

- **200 OK** — `{ "success": true }`
- **404** — Not found or not owned
- **401** — Unauthorized

---

### 11. Set entry mood

| Item            | Value                                      |
| --------------- | ------------------------------------------ |
| **File**        | `app/api/entries/[id]/mood/route.ts`       |
| **Method**      | `PUT`                                      |
| **Testing URL** | `http://localhost:3000/api/entries/1/mood` |
| **Auth**        | Required                                   |

**Requirement:** Body must include `label` (string). Creates or updates the mood for this entry.

**Request body:**

```json
{ "label": "Calm" }
```

**What to expect:**

- **200 OK** — `{ "data": { id, entryId, label, ... } }`
- **400** — `{ "error": "label is required" }`
- **404** — Entry not found or not owned
- **401** — Unauthorized

---

### 12. Add tag to entry

| Item            | Value                                      |
| --------------- | ------------------------------------------ |
| **File**        | `app/api/entries/[id]/tags/route.ts`       |
| **Method**      | `POST`                                     |
| **Testing URL** | `http://localhost:3000/api/entries/1/tags` |
| **Auth**        | Required                                   |

**Requirement:** Body must include `tag` (string). Adds a USER tag to the entry.

**Request body:**

```json
{ "tag": "work" }
```

**What to expect:**

- **201 Created** — `{ "data": { id, entryId, tag, source } }`
- **400** — `{ "error": "tag is required" }`
- **404** — Entry not found or not owned
- **401** — Unauthorized

---

### 13. Remove tag from entry

| Item            | Value                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------- |
| **File**        | `app/api/entries/[id]/tags/[tag]/route.ts`                                                    |
| **Method**      | `DELETE`                                                                                      |
| **Testing URL** | `http://localhost:3000/api/entries/1/tags/work` (encode `tag` if it has spaces/special chars) |
| **Auth**        | Required                                                                                      |

**Requirement:** Path `tag` = tag string (URL-encoded). Removes that tag from the entry.

**What to expect:**

- **200 OK** — success response
- **404** — Entry or tag not found / not owned
- **401** — Unauthorized

---

### 14. Regenerate AI (stub)

| Item            | Value                                               |
| --------------- | --------------------------------------------------- |
| **File**        | `app/api/entries/[id]/regenerate-ai/route.ts`       |
| **Method**      | `POST`                                              |
| **Testing URL** | `http://localhost:3000/api/entries/1/regenerate-ai` |
| **Auth**        | Required                                            |

**Requirement:** Stub only. No real AI processing.

**What to expect:**

- **501 Not Implemented** — stub response

---

## Current user

### 15. List my recent entries

| Item            | Value                                                 |
| --------------- | ----------------------------------------------------- |
| **File**        | `app/api/users/me/entries/route.ts`                   |
| **Method**      | `GET`                                                 |
| **Testing URL** | `http://localhost:3000/api/users/me/entries?limit=50` |
| **Auth**        | Required                                              |

**Requirement:** Query `limit` (default 50, max 100). Rate limited. Returns recent entries across all user journals.

**What to expect:**

- **200 OK** — `{ "data": [ entry, ... ] }` with `journal`, `summary`, `mood`, `tags`
- **429** — `{ "error": "Too many requests", "retryAfter": number }` when rate limited
- **401** — Unauthorized

---

### 16. Get my preferences

| Item            | Value                                            |
| --------------- | ------------------------------------------------ |
| **File**        | `app/api/users/me/preferences/route.ts`          |
| **Method**      | `GET`                                            |
| **Testing URL** | `http://localhost:3000/api/users/me/preferences` |
| **Auth**        | Required                                         |

**Requirement:** Returns current user preferences; creates default row if none exists.

**What to expect:**

- **200 OK** — `{ "data": { id, theme, goal, topics, reason, ... } }`
- **401** — Unauthorized

---

### 17. Update my preferences

| Item            | Value                                            |
| --------------- | ------------------------------------------------ |
| **File**        | `app/api/users/me/preferences/route.ts`          |
| **Method**      | `PATCH`                                          |
| **Testing URL** | `http://localhost:3000/api/users/me/preferences` |
| **Auth**        | Required                                         |

**Requirement:** Body may include `theme`, `goal`, `topics`, `reason` (strings or null).

**Request body (all optional):**

```json
{
  "theme": "dark",
  "goal": "Reflect daily",
  "topics": "gratitude",
  "reason": "Mental clarity"
}
```

**What to expect:**

- **200 OK** — `{ "data": updated preferences }`
- **401** — Unauthorized

---

### 18. Get my notification settings

| Item            | Value                                             |
| --------------- | ------------------------------------------------- |
| **File**        | `app/api/users/me/notification/route.ts`          |
| **Method**      | `GET`                                             |
| **Testing URL** | `http://localhost:3000/api/users/me/notification` |
| **Auth**        | Required                                          |

**Requirement:** Returns notification/reminder settings; creates default row if none.

**What to expect:**

- **200 OK** — `{ "data": { dailyReminderEnabled, dailyReminderTime, timezone, frequency, ... } }`
- **401** — Unauthorized

---

### 19. Update my notification settings

| Item            | Value                                             |
| --------------- | ------------------------------------------------- |
| **File**        | `app/api/users/me/notification/route.ts`          |
| **Method**      | `PATCH`                                           |
| **Testing URL** | `http://localhost:3000/api/users/me/notification` |
| **Auth**        | Required                                          |

**Requirement:** Body may include `dailyReminderEnabled`, `dailyReminderTime` (HH:mm), `timezone`, `frequency`.

**Request body (all optional):**

```json
{
  "dailyReminderEnabled": true,
  "dailyReminderTime": "09:00",
  "timezone": "America/Los_Angeles",
  "frequency": "DAILY"
}
```

**What to expect:**

- **200 OK** — `{ "data": updated notification }`
- **401** — Unauthorized

---

## Billing (Stripe)

### 20. Create checkout session

| Item            | Value                                        |
| --------------- | -------------------------------------------- |
| **File**        | `app/api/billing/checkout/route.ts`          |
| **Method**      | `POST`                                       |
| **Testing URL** | `http://localhost:3000/api/billing/checkout` |
| **Auth**        | Required                                     |

**Requirement:** Creates a Stripe Checkout Session. Redirect URLs use `APP_URL` from env.

**What to expect:**

- **200 OK** — `{ "data": { "url": string, "sessionId": string } }`
- **401** — Unauthorized
- **500** — Stripe or config error

---

### 21. Create customer portal session

| Item            | Value                                      |
| --------------- | ------------------------------------------ |
| **File**        | `app/api/billing/portal/route.ts`          |
| **Method**      | `POST`                                     |
| **Testing URL** | `http://localhost:3000/api/billing/portal` |
| **Auth**        | Required                                   |

**Requirement:** Creates a Stripe Customer Portal session for managing subscription.

**What to expect:**

- **200 OK** — `{ "data": { "url": string } }`
- **401** — Unauthorized
- **500** — Stripe or config error

---

## Moods

### 22. List my moods

| Item            | Value                             |
| --------------- | --------------------------------- |
| **File**        | `app/api/moods/route.ts`          |
| **Method**      | `GET`                             |
| **Testing URL** | `http://localhost:3000/api/moods` |
| **Auth**        | Required                          |

**Requirement:** Returns all mood logs for the current user.

**What to expect:**

- **200 OK** — `{ "data": [ { id, title, note, authorId, createdAt, updatedAt }, ... ] }`
- **401** — Unauthorized

---

### 23. Create mood log

| Item            | Value                             |
| --------------- | --------------------------------- |
| **File**        | `app/api/moods/route.ts`          |
| **Method**      | `POST`                            |
| **Testing URL** | `http://localhost:3000/api/moods` |
| **Auth**        | Required                          |

**Requirement:** Body must include `title` (string). Optional `note` (string).

**Request body:**

```json
{ "title": "Grateful", "note": "Had a good day" }
```

**What to expect:**

- **201 Created** — `{ "data": { id, title, note, ... } }`
- **400** — `{ "error": "title is required" }`
- **401** — Unauthorized

---

### 24. Get one mood

| Item            | Value                               |
| --------------- | ----------------------------------- |
| **File**        | `app/api/moods/[id]/route.ts`       |
| **Method**      | `GET`                               |
| **Testing URL** | `http://localhost:3000/api/moods/1` |
| **Auth**        | Required                            |

**Requirement:** Path `id` = mood ID. Returns mood only if owned.

**What to expect:**

- **200 OK** — `{ "data": { id, title, note, ... } }`
- **400** — Invalid id
- **404** — `{ "error": "Mood not found" }`
- **401** — Unauthorized

---

### 25. Update mood

| Item            | Value                               |
| --------------- | ----------------------------------- |
| **File**        | `app/api/moods/[id]/route.ts`       |
| **Method**      | `PATCH`                             |
| **Testing URL** | `http://localhost:3000/api/moods/1` |
| **Auth**        | Required                            |

**Requirement:** Body may include `title` (string), `note` (string or null).

**Request body (all optional):**

```json
{ "title": "Calm", "note": "Updated note" }
```

**What to expect:**

- **200 OK** — `{ "data": updated mood }`
- **404** — Mood not found or not owned
- **401** — Unauthorized

---

### 26. Delete mood

| Item            | Value                               |
| --------------- | ----------------------------------- |
| **File**        | `app/api/moods/[id]/route.ts`       |
| **Method**      | `DELETE`                            |
| **Testing URL** | `http://localhost:3000/api/moods/1` |
| **Auth**        | Required                            |

**Requirement:** Deletes the mood log if owned.

**What to expect:**

- **200 OK** — `{ "success": true }`
- **404** — Mood not found or not owned
- **401** — Unauthorized

---

## Onboarding

### 27. Complete onboarding

| Item            | Value                                        |
| --------------- | -------------------------------------------- |
| **File**        | `app/api/onboard/complete/route.ts`          |
| **Method**      | `POST`                                       |
| **Testing URL** | `http://localhost:3000/api/onboard/complete` |
| **Auth**        | Required                                     |

**Requirement:** Body must include `firstEntryContent` (string). Optional: `displayName`, `journalName`, `goal`, `topics`, `reason`, `dailyReminderTime` (HH:mm), `dailyReminderEnabled`. Creates journal, first entry, upserts preferences and notification, sets user `onboardingComplete` and `prefferdName`.

**Request body (minimal):**

```json
{
  "firstEntryContent": "My first entry text",
  "journalName": "My Journal",
  "displayName": "Alex",
  "goal": "Reflect daily",
  "topics": "gratitude",
  "reason": "Clarity",
  "dailyReminderTime": "09:00",
  "dailyReminderEnabled": true
}
```

**What to expect:**

- **201 Created** — `{ "data": { "journalId": number, "entryId": number } }`
- **400** — `{ "error": "firstEntryContent is required" }`
- **401** — Unauthorized

---

## Webhooks

### 28. Stripe webhook

| Item            | Value                                       |
| --------------- | ------------------------------------------- |
| **File**        | `app/api/webhooks/stripe/route.ts`          |
| **Method**      | `POST`                                      |
| **Testing URL** | `http://localhost:3000/api/webhooks/stripe` |
| **Auth**        | None (Stripe signature verification)        |

**Requirement:** Receives Stripe events (e.g. `checkout.session.completed`, `customer.subscription.*`). Must be called by Stripe with valid `Stripe-Signature` and raw body. Not for browser testing; use Stripe CLI or dashboard to send test events.

**What to expect:**

- **200 OK** — Event processed
- **4xx** — Invalid signature or payload

---

## Quick reference: all testing URLs

Assume base **`http://localhost:3000`**. Replace `1` with real IDs when testing.

| #   | Method | URL                                                     |
| --- | ------ | ------------------------------------------------------- |
| 1   | GET    | `/api/journals`                                         |
| 2   | POST   | `/api/journals`                                         |
| 3   | GET    | `/api/journals/1`                                       |
| 4   | PATCH  | `/api/journals/1`                                       |
| 5   | DELETE | `/api/journals/1`                                       |
| 6   | GET    | `/api/journals/1/entries?sort=newest&limit=20&offset=0` |
| 7   | POST   | `/api/journals/1/entries`                               |
| 8   | GET    | `/api/entries/1`                                        |
| 9   | PATCH  | `/api/entries/1`                                        |
| 10  | DELETE | `/api/entries/1`                                        |
| 11  | PUT    | `/api/entries/1/mood`                                   |
| 12  | POST   | `/api/entries/1/tags`                                   |
| 13  | DELETE | `/api/entries/1/tags/work`                              |
| 14  | POST   | `/api/entries/1/regenerate-ai`                          |
| 15  | GET    | `/api/users/me/entries?limit=50`                        |
| 16  | GET    | `/api/users/me/preferences`                             |
| 17  | PATCH  | `/api/users/me/preferences`                             |
| 18  | GET    | `/api/users/me/notification`                            |
| 19  | PATCH  | `/api/users/me/notification`                            |
| 20  | POST   | `/api/billing/checkout`                                 |
| 21  | POST   | `/api/billing/portal`                                   |
| 22  | GET    | `/api/moods`                                            |
| 23  | POST   | `/api/moods`                                            |
| 24  | GET    | `/api/moods/1`                                          |
| 25  | PATCH  | `/api/moods/1`                                          |
| 26  | DELETE | `/api/moods/1`                                          |
| 27  | POST   | `/api/onboard/complete`                                 |
| 28  | POST   | `/api/webhooks/stripe`                                  |

---

## Using the API from an Expo app (emulator & physical device)

### Is it safe?

Yes, **as long as you follow these rules:**

| Context                                       | Safe?           | Notes                                                                                                                                                                             |
| --------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Emulator → your dev server**                | OK for dev      | Use the URLs below; traffic stays on your machine or local network.                                                                                                               |
| **Physical phone on same Wi‑Fi → dev server** | OK for dev only | Use your computer’s LAN IP (e.g. `http://192.168.1.x:3000`). Traffic is **not** encrypted (HTTP). Fine for development; avoid with real user data on shared networks.             |
| **Physical phone → production**               | Yes, if HTTPS   | Always use **HTTPS** (e.g. `https://api.yourapp.com`). Never send real tokens or sensitive data over HTTP in production.                                                          |
| **Storing tokens / secrets in the app**       | Careful         | Never hardcode API keys or long‑lived secrets. Use env vars (e.g. `EXPO_PUBLIC_API_URL`) and store the Clerk session token in **expo-secure-store** (or similar) if you cache it. |

So: **safe to use from Expo on emulator and phone** for development; for production, use HTTPS and secure token storage.

---

### Base URL by environment

Pick one base URL and use it for all API calls (e.g. in a shared `api` client).

| Where the app runs                                | Base URL to use                                                                                                       |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **iOS Simulator**                                 | `http://localhost:3000`                                                                                               |
| **Android Emulator**                              | `http://10.0.2.2:3000` (this is the host machine’s `localhost` from the emulator)                                     |
| **Physical device (same Wi‑Fi as your computer)** | `http://<YOUR_COMPUTER_IP>:3000` (e.g. `http://192.168.1.186:3000`) — find IP with `ifconfig` / `ipconfig`            |
| **Physical device (tunnel)**                      | `https://<your-ngrok-subdomain>.ngrok.io` (run `ngrok http 3000`; then use the **https** URL so traffic is encrypted) |
| **Production**                                    | `https://your-domain.com` (always HTTPS)                                                                              |

Example with a single config (e.g. in Expo):

```ts
// In Expo, use EXPO_PUBLIC_API_URL or detect platform
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android"
    ? "http://10.0.2.2:3000"
    : "http://localhost:3000");
// Then: fetch(`${API_BASE}/api/journals`, ...)
```

For a **physical phone**, set `EXPO_PUBLIC_API_URL` to your computer’s IP or ngrok URL so the device can reach the server.

---

### Auth from Expo (important)

The backend currently uses **Clerk’s server-side auth** and expects a **session** (typically **cookies** in the browser). Native apps don’t send cookies the same way, so you have two options:

1. **Use Clerk’s session token (recommended for Expo)**  
    In the Expo app, use the Clerk React Native SDK and send the session token on every request:
   - Get the token: `const token = await getToken();`
   - Send it: `headers: { 'Authorization': \`Bearer ${token}\`, 'Content-Type': 'application/json' }` 
For this to work, the **Next.js API must accept and validate a Bearer token** (not only cookies). Right now`requireAuth()`uses Clerk’s`auth()`, which reads the session from the request. Clerk can validate a Bearer token if you pass it through; you may need to add a small piece of middleware or use Clerk’s JWT verification so that requests with `Authorization: Bearer <token>` are treated as authenticated.

2. **Cookie-based (e.g. Expo web / WebView)**  
   If the Expo app is actually a WebView loading your Next.js site, cookies can work like in the browser. For a true native Expo app, prefer the Bearer token approach above.

So: **yes, it’s safe to send these requests from Expo**, but make sure:

- **Emulator / dev:** use the correct base URL (localhost, 10.0.2.2, or LAN IP).
- **Physical device:** use LAN IP or ngrok (HTTPS with ngrok is better on shared Wi‑Fi).
- **Production:** use HTTPS only.
- **Auth:** use Clerk’s token in `Authorization: Bearer <token>` and ensure the backend accepts it (add Bearer support if you only have cookie auth today).

---

### CORS and headers

The API already sends CORS headers and allows `Authorization` and `Content-Type`. From a **native** Expo app (no browser), CORS doesn’t apply the same way; the main requirement is sending the right headers (e.g. `Content-Type: application/json`, `Authorization: Bearer <token>`). If you use **Expo web**, the browser will enforce CORS; the server’s current CORS setup is fine for normal use. If you add a custom origin for your app (e.g. production app URL), add it to `ALLOWED_ORIGINS` in production.

---

## Running the app for testing

1. Start the dev server: `npm run dev`
2. Ensure the app is available at `http://localhost:3000`
3. Sign in (e.g. via Clerk) so session cookies are set
4. Use the URLs above from the same origin (browser or API client with credentials), or send the same auth your frontend uses (e.g. cookie or Bearer token)
