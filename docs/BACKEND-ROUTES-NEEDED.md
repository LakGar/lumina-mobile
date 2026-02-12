# Backend Routes To Create

Routes the Lumina mobile app expects but that may not exist yet on the backend. Implement these so privacy, billing, and insights work end-to-end.

---

## Database: Fix 500 on GET /api/journals/:id/entries

**Symptom:** `GET /api/journals/4/entries` returns **500** with:

```text
The column `EntrySummary.qualityScore` does not exist in the current database.
```

**Cause:** The backend Prisma query for journal entries includes `EntrySummary` and selects `qualityScore`, but the column has not been added to the database yet.

**Fix (in the Lumina backend repo):**

1. **Add the column to the Prisma schema**  
   In your `EntrySummary` model (or equivalent), add:

   ```prisma
   model EntrySummary {
     id           Int      @id @default(autoincrement())
     entryId      Int
     text         String?
     model        String?
     qualityScore Int?     // add this line
     createdAt    DateTime @default(now())
     // ... other fields
     entry        JournalEntry @relation(...)
   }
   ```

2. **Create and run a migration:**

   ```bash
   npx prisma migrate dev --name add_entry_summary_quality_score
   ```

3. **Redeploy / restart** the backend so the new schema is used.

After this, `GET /api/journals/:id/entries` and AI insight flows that use `EntrySummary.qualityScore` should work.

**Temporary workaround (if you can’t run a migration yet):** In the backend, change the route that fetches journal entries so it does **not** include or select `qualityScore` from `EntrySummary` (e.g. use a `select` that omits `qualityScore`, or omit the summary relation from the query until the column exists).

---

## Privacy / data deletion

### 1. Delete all journal data

**Method:** `DELETE`  
**Path:** `/api/users/me/journals`

**Purpose:** Permanently delete all journals and all entries for the current user. Used by **Privacy settings → Delete journal data**.

**Request**

- **Headers:** `Authorization: Bearer <token>` (or session).
- **Body:** none.

**Response**

- **Success:** `204 No Content` or `200 OK` with empty/minimal body.
- **Errors:** `401` (unauthenticated), `403` (forbidden), `500` (server error).

**Backend behavior**

- Resolve user from auth.
- Delete all journal entries for that user, then all journals for that user (or in one transactional delete).
- Do not delete the user account or preferences; only journal + entry data.

---

## 2. Delete AI / personalization data

**Method:** `DELETE`  
**Path:** `/api/users/me/ai-data`

**Purpose:** Delete stored AI-related data for the current user (e.g. prompts, personalization cache). Used by **Privacy settings → Delete AI data**.

**Request**

- **Headers:** `Authorization: Bearer <token>`.
- **Body:** none.

**Response**

- **Success:** `204 No Content` or `200 OK`.
- **Errors:** `401`, `403`, `500`.

**Backend behavior**

- Resolve user from auth.
- Remove any stored prompts, AI suggestions cache, or other AI/personalization data keyed to this user.
- If you have no such storage yet, implement the route and no-op (return 204) so the app does not get 404.

---

## 3. Delete all user data

**Method:** `POST`  
**Path:** `/api/users/me/delete-all-data`

**Purpose:** Permanently delete all data for the current user (journals, entries, preferences, notification settings, AI data, etc.). The app signs the user out after a successful call. Used by **Privacy settings → Delete all data**.

**Request**

- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`.
- **Body:** `{}` (empty object acceptable).

**Response**

- **Success:** `204 No Content` or `200 OK`.
- **Errors:** `401`, `403`, `500`.

**Backend behavior**

- Resolve user from auth.
- In a transaction (if possible):
  - Delete all entries and journals for the user.
  - Delete user preferences, notification settings, onboarding state.
  - Delete AI/personalization data for the user.
- Do **not** delete the user’s auth identity (e.g. Clerk user); only app-owned data. The app will call Clerk’s sign-out separately.

---

## Stripe / billing

### 4. Create checkout session

**Method:** `POST`  
**Path:** `/api/billing/checkout`

**Purpose:** Create a Stripe Checkout Session for subscription (or one-time) purchase. The app opens the returned URL in a browser so the user can pay and subscribe. Used by **Upgrade / Subscription** screen (“Upgrade” button).

**Request**

- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`.
- **Body:** optional, e.g. `{ "priceId": "string" }` if you have multiple plans; otherwise omit and use your default subscription price.

**Response:** `200 OK` or `201 Created`

```json
{
  "data": {
    "url": "https://checkout.stripe.com/...",
    "sessionId": "optional-stripe-session-id"
  }
}
```

**Backend behavior**

- Resolve user from auth; ensure Stripe customer exists for user (create if not).
- Create a Stripe Checkout Session for the subscription (or plan) you want to offer.
- Return the session `url` so the app can open it in `WebBrowser.openBrowserAsync(url)`.
- On success, Stripe will call your webhook; use it to update subscription status for the user.

---

### 5. Create customer portal session

**Method:** `POST`  
**Path:** `/api/billing/portal`

**Purpose:** Create a Stripe Customer Portal session so the user can manage subscription, payment methods, and invoices. Used by **Upgrade** screen (“Manage subscription” / “Manage billing”).

**Request**

- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`.
- **Body:** optional, e.g. `{ "returnUrl": "string" }` for redirect after portal.

**Response:** `200 OK`

```json
{
  "data": {
    "url": "https://billing.stripe.com/..."
  }
}
```

**Backend behavior**

- Resolve user from auth; get their Stripe customer ID.
- Create a Stripe Billing Portal session for that customer.
- Return the portal `url` so the app can open it in the browser.

---

### 6. Stripe webhook

**Method:** `POST`  
**Path:** `/api/webhooks/stripe`

**Purpose:** Receive Stripe events (e.g. `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`). Not called by the app; Stripe sends requests to this URL.

**Request**

- **Headers:** `Stripe-Signature` (for verification). Body must be raw (for signature verification).
- **Body:** Stripe event JSON.

**Response:** `200 OK` (acknowledge receipt). Return 4xx on signature verification failure.

**Backend behavior**

- Verify request using Stripe webhook signing secret.
- On `checkout.session.completed`: link subscription to user, set subscription status.
- On `customer.subscription.*`: update user’s subscription status (active, canceled, past_due, etc.).
- Optionally expose subscription status via e.g. `GET /api/users/me/subscription` so the app can show “Manage subscription” vs “Upgrade”.

---

## User stats / insights (for dashboard and Lumina level)

### 7. Get user stats (Lumina level, dashboard metrics)

**Method:** `GET`  
**Path:** `/api/users/me/stats`

**Purpose:** Return aggregated stats for the current user so the app can show dashboard metrics, Lumina level, last journal, entries this week, mood score, streak, consistency, etc., from a single source of truth. The app can compute these client-side from entries today; this route is for backend authority and future features (e.g. server-side Lumina level).

**Request**

- **Headers:** `Authorization: Bearer <token>`.

**Response:** `200 OK`

```json
{
  "data": {
    "luminaScore": 0,
    "luminaLevel": 1,
    "lastJournal": { "title": "string", "journalId": "string", "daysAgo": 0 },
    "entriesThisWeek": 0,
    "moodScore": null,
    "entryQualityScore": null,
    "currentStreak": 0,
    "reflections": 0,
    "gratitudeEntries": 0,
    "wordsPerEntry": null,
    "consistency": 0,
    "promptsCompleted": 0
  }
}
```

**Field descriptions (for backend)**

| Field                 | Type           | Description                                                                                                                                                              |
| --------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **luminaScore**       | number         | Gamification score (e.g. 0–1000+). Increase with journaling activity; used to advance Lumina level. Can be derived from entries, streak, consistency, prompts completed. |
| **luminaLevel**       | number         | User’s current “Lumina level” tier (e.g. 1–5). Backend can define thresholds (e.g. 0–99 → 1, 100–499 → 2). Used in UI for progress and premium/unlock messaging.         |
| **lastJournal**       | object \| null | Last journal the user wrote in: `title`, `journalId`, `daysAgo` (number of days since last entry). Null if no entries.                                                   |
| **entriesThisWeek**   | number         | Count of entries created in the current week (calendar week).                                                                                                            |
| **moodScore**         | number \| null | Aggregate mood “score” (e.g. 0–10 or 1–5) from entries that have a mood, or null if none. Backend can average numeric mood values or map labels to numbers.              |
| **entryQualityScore** | number \| null | Optional quality/engagement score (e.g. 0–100) if you compute it (e.g. from word count, consistency). Null if not computed.                                              |
| **currentStreak**     | number         | Consecutive days (including today) with at least one journal entry. 0 if none today and no streak.                                                                       |
| **reflections**       | number         | Total count of reflection-type entries (or entries in a “reflections” journal). Can be same as total entries if not distinguished.                                       |
| **gratitudeEntries**  | number         | Count of entries that have a mood or are tagged as gratitude (or in a gratitude journal).                                                                                |
| **wordsPerEntry**     | number \| null | Average word count per entry. Null if no entries.                                                                                                                        |
| **consistency**       | number         | Percentage of days in the last 30 days that have at least one entry (0–100).                                                                                             |
| **promptsCompleted**  | number         | Count of “prompt completed” actions in the current month (or all-time if you prefer).                                                                                    |

**Lumina level (backend description)**

- **Lumina level** is a tier (e.g. 1–5) driven by **luminaScore**.
- **luminaScore** increases with: entries written, streak length, consistency, prompts completed, mood logged, etc. Exact formula is up to the backend (e.g. 1 point per entry, 5 per day in streak, 10 per prompt).
- Example thresholds: Level 1 = 0–99, Level 2 = 100–299, Level 3 = 300–599, Level 4 = 600–999, Level 5 = 1000+.
- The app shows “Lumina level” and progress (e.g. 0% at score 0 with “Start journaling to earn points”). Backend can return both `luminaScore` and `luminaLevel`; app can derive progress within current level if you expose score and level thresholds.

**Backend behavior**

- Resolve user from auth; load their journals and entries (or use pre-aggregated stats if you store them).
- Compute each field from entries/journals (and any prompt-completion or mood tables).
- Return the above shape. Omit or null optional fields if not implemented yet.

---

## Calendar (entries + reminders)

The calendar view calls **GET /api/users/me/entries** and **GET /api/users/me/reminders**. To avoid 429 and make reminders work:

### 1. GET /api/users/me/entries — rate limit and optional date filter

**Problem:** The app was sending `?limit=300&from=...&to=...`, which can trigger 429 (Too Many Requests) when the calendar loads or refetches.

**Fix (backend):**

- **Raise or relax rate limit** for `GET /api/users/me/entries` (e.g. allow at least a few requests per minute per user for calendar).
- **Optional:** Support query params **`from`** and **`to`** (both `YYYY-MM-DD`). If present, return only entries whose **date part of `createdAt`** (in your DB timezone or user timezone) is between `from` and `to` inclusive. That lets the app request only the visible range and reduce payload. If you don’t add this, the app still works by requesting recent entries (e.g. `limit=100`) and filtering by date on the client.

**Response shape:** Either `{ "data": entries }` or `{ "entries": entries }`; the app accepts both. Each entry: `id`, `journalId`, `createdAt`, `updatedAt`, `title` (optional), `content` (or `body`), `mood`, `tags`.

### 2. Reminders — new resource (calendar scheduled reminders)

**Problem:** **GET /api/users/me/reminders** returns **404** because the route doesn’t exist yet. The app treats 404 as “no reminders” and continues; to make “Schedule reminder” and week reset work, implement the following.

**Routes to add:**

| Method | Path                           | Purpose                                                     |
| ------ | ------------------------------ | ----------------------------------------------------------- |
| GET    | `/api/users/me/reminders`      | List reminders (optional query: `from`, `to` as YYYY-MM-DD) |
| POST   | `/api/users/me/reminders`      | Create reminder                                             |
| PATCH  | `/api/users/me/reminders/[id]` | Update reminder                                             |
| DELETE | `/api/users/me/reminders/[id]` | Delete reminder                                             |

**Request/response:**

- **GET**
  - Query (optional): `from`, `to` (YYYY-MM-DD). Return reminders where `dateISO` is in [from, to].
  - Response: `200 OK` with `{ "data": reminders }` or `{ "reminders": reminders }`. Each reminder: `id`, `dateISO`, `time`, `repeat`, `title`, `journalId`, `createdAt`, `updatedAt`.

- **POST**
  - Body: `{ "dateISO": "YYYY-MM-DD", "time": "HH:mm", "repeat": "none" | "daily" | "weekdays" | "weekly", "title": "string", "journalId": "string | null" }`.
  - Response: `201` with created reminder (same shape).

- **PATCH**
  - Body: same fields as POST, all optional.
  - Response: `200` with updated reminder.

- **DELETE**
  - Response: `204 No Content` or `200 OK`.

**Prisma schema addition** (add to your `schema.prisma`):

```prisma
model Reminder {
  id       Int    @id @default(autoincrement())
  dateISO  String // "YYYY-MM-DD"
  time     String // "HH:mm"
  repeat   String @default("none") // "none" | "daily" | "weekdays" | "weekly"
  title    String
  journalId Int?  // optional; which journal to open when user taps reminder

  author   User   @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId Int

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([authorId, dateISO])
}
```

**User model** — add the relation:

```prisma
model User {
  // ... existing fields ...
  journal   Journal[]
  mood      Mood[]
  reminders Reminder[]  // add this line
}
```

Then run `npx prisma migrate dev` (or your migration flow) and implement the four routes above, resolving the current user from auth and scoping all queries/mutations by `authorId`.

**Optional:** For the calendar “Reset” button (clear reminders for a week), either:

- Have the app call **DELETE /api/users/me/reminders/[id]** for each reminder in that week, or
- Add **DELETE /api/users/me/reminders?from=YYYY-MM-DD&to=YYYY-MM-DD** to delete all reminders in that date range.

---

## Optional

- **GET /api/users/me/subscription** – Return `{ status: "active" | "canceled" | "past_due" | null, planId?: string }` so the app can show “Manage subscription” vs “Upgrade” and gate premium features.
- **Account management URL:** The app uses `EXPO_PUBLIC_CLERK_ACCOUNT_URL` for profile/email/password; no backend route required.

---

## Summary

| Method | Path                            | Purpose                                                                                                                                                |
| ------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DELETE | `/api/users/me/journals`        | Delete all journal data                                                                                                                                |
| DELETE | `/api/users/me/ai-data`         | Delete AI data                                                                                                                                         |
| POST   | `/api/users/me/delete-all-data` | Delete all user data                                                                                                                                   |
| POST   | `/api/billing/checkout`         | Create Stripe Checkout Session (upgrade)                                                                                                               |
| POST   | `/api/billing/portal`           | Create Stripe Customer Portal session (manage billing)                                                                                                 |
| POST   | `/api/webhooks/stripe`          | Stripe webhook (subscription events)                                                                                                                   |
| GET    | `/api/users/me/stats`           | User stats: Lumina level, last journal, entries this week, mood score, streak, reflections, gratitude, words per entry, consistency, prompts completed |
| GET    | `/api/users/me/entries`         | List user entries (relax rate limit for calendar; optional query: `from`, `to` YYYY-MM-DD)                                                             |
| GET    | `/api/users/me/reminders`       | List reminders (optional `from`, `to`)                                                                                                                 |
| POST   | `/api/users/me/reminders`       | Create reminder                                                                                                                                        |
| PATCH  | `/api/users/me/reminders/[id]`  | Update reminder                                                                                                                                        |
| DELETE | `/api/users/me/reminders/[id]`  | Delete reminder                                                                                                                                        |

All except the webhook require authentication (e.g. Clerk JWT). The webhook must verify Stripe signature.
