# Lumina API Reference (Frontend / Agent)

**Single source of truth for the frontend agent.** Use this document when building the Lumina web or mobile app. It describes every route, request shape, and response shape implemented on the backend.

---

**Base URL:** Your backend origin (e.g. `https://api.lumina.com` or `http://localhost:3000`).

**Auth:** All routes below except Stripe webhook require an authenticated user (Clerk). Send the session (e.g. `Authorization: Bearer <token>` or cookies with `credentials: "include"`). Unauthenticated requests get `401 Unauthorized`.

**Conventions:**

- Success responses use `{ "data": ... }`. List responses may also include `total` where noted.
- Error responses use `{ "error": "string" }` with appropriate status code.
- IDs in paths and bodies are **numbers** (e.g. `journalId: 4`).
- Dates are ISO 8601 strings (e.g. `"2025-02-03T12:00:00.000Z"`).
- Send `Content-Type: application/json` for all request bodies.
- CORS: backend supports OPTIONS; use the same origin or allowed origins from env.

**Error response format:** On 4xx/5xx the body is JSON: `{ "error": "Human-readable message" }`. Use the HTTP status as the source of truth; the message is for logging/display.

**Rate limits:** `GET /api/users/me/entries` (and other routes that use the in-memory rate limiter) allow 120 requests per user per minute. On exceed: `429 Too Many Requests` with `Retry-After` header (seconds). Calendar usage with `from`/`to` and limit up to 300 is supported within this limit.

**Common status codes:** `200` OK, `201` Created, `204` No Content, `400` Bad Request, `401` Unauthorized, `404` Not Found, `429` Too Many Requests, `500` Server Error, `502` Bad Gateway (e.g. AI failure).

---

## Table of contents

1. [Journals](#1-journals)
2. [Journal entries (by journal)](#2-journal-entries-by-journal)
3. [Entries (by ID)](#3-entries-by-id)
4. [Moods (standalone)](#4-moods-standalone)
5. [User: entries, preferences, notification](#5-user-entries-preferences-notification)
6. [User: stats, subscription](#6-user-stats-subscription)
7. [User: privacy & data deletion](#7-user-privacy--data-deletion)
8. [User: reminders](#8-user-reminders)
9. [User: weekly tips](#9-user-weekly-tips)
10. [Billing](#10-billing)
11. [Onboarding](#11-onboarding)
12. [Journal chat (AI)](#12-journal-chat-ai)
13. [Webhooks](#13-webhooks)
14. [Quick reference table](#14-quick-reference-table)

---

## 1. Journals

### GET /api/journals

List all journals for the current user.

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": 1,
      "title": "Daily reflection",
      "public": false,
      "createdAt": "2025-02-01T00:00:00.000Z",
      "updatedAt": "2025-02-03T00:00:00.000Z",
      "_count": { "entries": 5 }
    }
  ]
}
```

---

### POST /api/journals

Create a journal.

**Body:**

```json
{
  "title": "string (required)",
  "public": false
}
```

**Response:** `201 Created`

```json
{
  "data": {
    "id": 1,
    "title": "Daily reflection",
    "public": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Errors:** `400` if `title` is missing or empty.

---

### GET /api/journals/[id]

Get one journal by ID. User must own the journal.

**Path:** `id` — journal ID (number).

**Response:** `200 OK`

```json
{
  "data": {
    "id": 1,
    "title": "Daily reflection",
    "public": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Errors:** `400` invalid id, `404` not found or not owned.

---

### PATCH /api/journals/[id]

Update a journal.

**Path:** `id` — journal ID.

**Body:** (all optional)

```json
{
  "title": "string",
  "public": true
}
```

**Response:** `200 OK` — same shape as GET one journal.

**Errors:** `400`, `404`.

---

### DELETE /api/journals/[id]

Delete a journal (and its entries via cascade).

**Path:** `id` — journal ID.

**Response:** `204 No Content` or `200 OK`.

**Errors:** `400`, `404`.

---

## 2. Journal entries (by journal)

### GET /api/journals/[id]/entries

List entries for a journal. User must own the journal.

**Path:** `id` — journal ID.

**Query:**

| Param  | Type   | Default  | Description                          |
| ------ | ------ | -------- | ------------------------------------ |
| sort   | string | `newest` | `newest` \| `oldest` \| `lastEdited` |
| limit  | number | 50       | 1–100                                |
| offset | number | 0        | Pagination offset                    |

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": 10,
      "journalId": 1,
      "content": "...",
      "source": "TEXT",
      "createdAt": "...",
      "updatedAt": "...",
      "summary": {
        "id": 1,
        "text": "Summary text",
        "model": "openrouter",
        "qualityScore": 72,
        "createdAt": "..."
      },
      "mood": {
        "id": 1,
        "label": "calm",
        "score": 0.72,
        "createdAt": "..."
      },
      "tags": [{ "id": 1, "tag": "work", "source": "AI" }]
    }
  ],
  "total": 42
}
```

`summary`, `mood`, or `tags` may be `null` / `[]`. **Errors:** `400`, `404`, `500` (e.g. if `EntrySummary.qualityScore` column is missing — run migrations).

---

### POST /api/journals/[id]/entries

Create an entry in a journal.

**Path:** `id` — journal ID.

**Body:**

```json
{
  "content": "string (required)",
  "source": "TEXT",
  "mood": "string (optional)",
  "tags": ["string", "..."]
}
```

`source`: `TEXT` | `VOICE` | `MIXED`. Default `TEXT`.

**Response:** `201 Created`

```json
{
  "data": {
    "id": 10,
    "journalId": 1,
    "content": "...",
    "source": "TEXT",
    "createdAt": "...",
    "updatedAt": "...",
    "summary": null,
    "mood": { "id": 1, "label": "calm", "score": null, "createdAt": "..." },
    "tags": []
  }
}
```

**Errors:** `400` (e.g. missing content), `404` (journal not found).

---

## 3. Entries (by ID)

All paths use **entry** ID (number).

### GET /api/entries/[id]

Get one entry. User must own the entry’s journal.

**Response:** `200 OK`

```json
{
  "data": {
    "id": 10,
    "journalId": 1,
    "content": "...",
    "source": "TEXT",
    "createdAt": "...",
    "updatedAt": "...",
    "summary": {
      "id": 1,
      "text": "...",
      "model": "...",
      "qualityScore": 72,
      "createdAt": "..."
    },
    "mood": { "id": 1, "label": "calm", "score": 0.72, "createdAt": "..." },
    "tags": [{ "id": 1, "tag": "work", "source": "AI" }]
  }
}
```

**Errors:** `400`, `404`.

---

### PATCH /api/entries/[id]

Update an entry (content, source, mood, tags).

**Body:** (all optional)

```json
{
  "content": "string",
  "source": "TEXT",
  "mood": "string",
  "tags": ["string", "..."]
}
```

Setting `tags` replaces user-set tags for this entry. **Response:** `200 OK` with full entry (same shape as GET). **Errors:** `400`, `404`, `500`.

---

### DELETE /api/entries/[id]

Delete an entry. **Response:** `204 No Content`. **Errors:** `400`, `404`.

---

### PUT /api/entries/[id]/mood

Set or update the **entry mood** (per-entry mood label, not the standalone Mood model).

**Body:**

```json
{
  "label": "string (required)"
}
```

**Response:** `200 OK`

```json
{
  "data": {
    "id": 1,
    "entryId": 10,
    "label": "calm",
    "score": null,
    "createdAt": "..."
  }
}
```

**Errors:** `400` (missing label), `404` (entry not found).

---

### POST /api/entries/[id]/tags

Add a tag to an entry (or upsert). User-owned tag.

**Body:**

```json
{
  "tag": "string (required)"
}
```

**Response:** `201 Created`

```json
{
  "data": {
    "id": 1,
    "entryId": 10,
    "tag": "work",
    "source": "USER"
  }
}
```

**Errors:** `400`, `404`.

---

### DELETE /api/entries/[id]/tags/[tag]

Remove a tag from an entry. **Path:** `id` = entry ID, `tag` = tag string (URL-encoded if needed). **Response:** `204 No Content`. **Errors:** `400`, `404`.

---

### POST /api/entries/[id]/regenerate-ai

Generate or refresh AI summary, mood, tags, and quality score for the entry. Uses backend AI (OpenRouter).

**Body:** none.

**Response:** `200 OK` — full entry with updated `summary`, `mood`, `tags` (and `summary.qualityScore` when present).

**Errors:** `400`, `404`, `502` (AI/backend error).

---

### POST /api/entries/[id]/go-deeper

Get 2–4 short reflection questions to help the user go deeper. Optional body: current draft.

**Body (optional):**

```json
{
  "currentContent": "string"
}
```

If omitted, backend uses saved entry content.

**Response:** `200 OK`

```json
{
  "data": {
    "questions": [
      "What would you tell a friend in the same situation?",
      "How did you feel right after that happened?"
    ]
  }
}
```

**Errors:** `400`, `404`, `502`.

---

## 4. Moods (standalone)

Standalone mood log (dashboard “Log mood”), not per-entry mood.

### GET /api/moods

List user’s mood logs. **Response:** `200 OK`

```json
{
  "data": [
    {
      "id": 1,
      "title": "Anxious",
      "note": "Work deadline",
      "authorId": 1
    }
  ]
}
```

---

### POST /api/moods

Create a mood log. **Body:**

```json
{
  "title": "string (required)",
  "note": "string (optional)"
}
```

**Response:** `201 Created` with `{ "data": mood }`. **Errors:** `400` if title missing.

---

### GET /api/moods/[id]

Get one mood. **Response:** `200 OK` with `{ "data": mood }`. **Errors:** `400`, `404`.

---

### PATCH /api/moods/[id]

Update mood. **Body:** `{ "title": "string", "note": "string" }` (optional). **Response:** `200 OK`. **Errors:** `400`, `404`.

---

### DELETE /api/moods/[id]

Delete mood. **Response:** `204 No Content`. **Errors:** `404`.

---

## 5. User: entries, preferences, notification

### GET /api/users/me/entries

List **all** entries for the current user (across journals). Used for calendar and “all entries” views.

**Query:**

| Param | Type   | Default | Description                                     |
| ----- | ------ | ------- | ----------------------------------------------- |
| limit | number | 50      | Max 300                                         |
| from  | string | —       | YYYY-MM-DD; only entries on or after this date  |
| to    | string | —       | YYYY-MM-DD; only entries on or before this date |

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": 10,
      "journalId": 1,
      "content": "...",
      "source": "TEXT",
      "createdAt": "...",
      "updatedAt": "...",
      "journal": { "id": 1, "title": "Daily" },
      "summary": {
        "id": 1,
        "text": "...",
        "qualityScore": 72,
        "createdAt": "..."
      },
      "mood": { "id": 1, "label": "calm", "score": 0.72, "createdAt": "..." },
      "tags": []
    }
  ]
}
```

**Errors:** `429` if rate limit exceeded (Retry-After header), `500`.

---

### GET /api/users/me/preferences

Get user preferences (theme, goal, topics, reason, AI toggles).

**Response:** `200 OK`

```json
{
  "data": {
    "id": 1,
    "theme": "SYSTEM",
    "goal": "Reflect daily",
    "topics": "work, health",
    "reason": "Mental clarity",
    "aiSummariesEnabled": true,
    "autoTaggingEnabled": true,
    "moodDetectionEnabled": true,
    "aiTone": "supportive",
    "authorId": 1,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

`theme`: `DARK` | `LIGHT` | `SYSTEM`. Nullable fields may be `null`.

---

### PATCH /api/users/me/preferences

Update preferences. **Body (all optional):**

```json
{
  "theme": "DARK",
  "goal": "string | null",
  "topics": "string | null",
  "reason": "string | null"
}
```

**Response:** `200 OK` with full preferences object.

---

### GET /api/users/me/notification

Get notification settings. **Response:** `200 OK`

```json
{
  "data": {
    "id": 1,
    "dailyReminderEnabled": true,
    "dailyReminderTime": "20:30",
    "timezone": "America/Los_Angeles",
    "frequency": "DAILY",
    "authorId": 1,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

`frequency`: `DAILY` | `WEEKLY` | `ALTERNATE` | null.

---

### PATCH /api/users/me/notification

Update notification settings. **Body (all optional):**

```json
{
  "dailyReminderEnabled": true,
  "dailyReminderTime": "20:30",
  "timezone": "America/Los_Angeles",
  "frequency": "DAILY"
}
```

**Response:** `200 OK` with full notification object.

---

## 6. User: stats, subscription

### GET /api/users/me/stats

Aggregated stats for dashboard and Lumina level.

**Response:** `200 OK`

```json
{
  "data": {
    "luminaScore": 150,
    "luminaLevel": 2,
    "lastJournal": {
      "title": "Daily",
      "journalId": 1,
      "daysAgo": 0
    },
    "entriesThisWeek": 5,
    "moodScore": 7.2,
    "entryQualityScore": 72.5,
    "currentStreak": 3,
    "reflections": 42,
    "gratitudeEntries": 10,
    "wordsPerEntry": 120.5,
    "consistency": 80,
    "promptsCompleted": 4
  }
}
```

`lastJournal` may be `null`. `moodScore`, `entryQualityScore`, `wordsPerEntry` may be `null`. Lumina level is 1–5; score drives level (see docs/LUMINA-LEVEL.md).

---

### GET /api/users/me/subscription

Subscription status for billing UI. **Response:** `200 OK`

```json
{
  "data": {
    "status": "active",
    "planId": "pro"
  }
}
```

`status`: `active` | `trialing` | `past_due` | `canceled` | null. `planId` optional.

---

## 7. User: privacy & data deletion

### DELETE /api/users/me/journals

Delete **all** journals and all entries for the current user. Does not delete account or preferences.

**Body:** none. **Response:** `204 No Content`. **Errors:** `401`, `500`.

---

### DELETE /api/users/me/ai-data

Delete stored AI/personalization data. If none exists, returns 204 (no-op).

**Body:** none. **Response:** `204 No Content`. **Errors:** `401`, `500`.

---

### POST /api/users/me/delete-all-data

Delete all app-owned data for the user: journals, entries, preferences, notification, moods, reminders, chat sessions, weekly tips, prompt completions; resets onboarding. Does **not** delete auth identity (Clerk) or Billing row.

**Body:** `{}` or empty. **Response:** `204 No Content`. **Errors:** `401`, `500`.

---

## 8. User: reminders

Calendar scheduled reminders. All require auth.

### GET /api/users/me/reminders

List reminders. **Query (optional):** `from`, `to` (YYYY-MM-DD) to filter by `dateISO`.

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": 1,
      "dateISO": "2025-02-04",
      "time": "09:00",
      "repeat": "none",
      "title": "Morning journal",
      "journalId": 1,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

`repeat`: `none` | `daily` | `weekdays` | `weekly`. `journalId` may be null.

---

### POST /api/users/me/reminders

Create a reminder. **Body:**

```json
{
  "dateISO": "2025-02-04",
  "time": "09:00",
  "repeat": "none",
  "title": "Morning journal",
  "journalId": 1
}
```

`dateISO`: YYYY-MM-DD. `time`: HH:mm. `repeat`: `none` | `daily` | `weekdays` | `weekly`. `journalId` optional (number or string); must be user’s journal if set.

**Response:** `201 Created` with `{ "data": reminder }`. **Errors:** `400` (invalid date/time/title), `404` (journal not found).

---

### PATCH /api/users/me/reminders/[id]

Update a reminder. **Body (all optional):** `dateISO`, `time`, `repeat`, `title`, `journalId`. **Response:** `200 OK` with full reminder. **Errors:** `400`, `404`.

---

### DELETE /api/users/me/reminders/[id]

Delete a reminder. **Response:** `204 No Content`. **Errors:** `400`, `404`.

---

## 9. User: weekly tips

### GET /api/users/me/weekly-tips

List recent weekly tips. **Query:** `limit` (default 10, max 50).

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": 1,
      "title": "Small steps back to journaling",
      "shortDescription": "You've missed a few days...",
      "detailedText": "**Be kind to yourself.**\n\n...",
      "tipType": "missed_journal",
      "readAt": null,
      "createdAt": "..."
    }
  ]
}
```

`tipType`: `missed_journal` | `quality_down` | `streak` | `consistency` | `general`. `readAt`: ISO string or null.

---

### POST /api/users/me/weekly-tips/generate

Generate one weekly tip from user stats and recent activity. **Body:** none.

**Response:** `201 Created`

```json
{
  "data": {
    "id": 1,
    "title": "...",
    "shortDescription": "...",
    "detailedText": "...",
    "tipType": "general",
    "readAt": null,
    "createdAt": "..."
  }
}
```

**Errors:** `502` if AI fails.

---

### PATCH /api/users/me/weekly-tips/[id]/read

Mark a tip as read. **Body:** none. **Response:** `204 No Content`. **Errors:** `404`.

---

## 10. Billing

### POST /api/billing/checkout

Create Stripe Checkout Session for subscription. **Body:** optional `{ "priceId": "string" }`; backend can use default price.

**Response:** `200 OK`

```json
{
  "data": {
    "url": "https://checkout.stripe.com/...",
    "sessionId": "..."
  }
}
```

Open `url` in browser for payment. **Errors:** `401`, `503` if billing not configured.

---

### POST /api/billing/portal

Create Stripe Customer Portal session (manage subscription, payment methods). **Body:** optional `{ "returnUrl": "string" }`.

**Response:** `200 OK`

```json
{
  "data": {
    "url": "https://billing.stripe.com/..."
  }
}
```

**Errors:** `401`, `500`.

---

### POST /api/billing/sync

Refresh subscription status from Stripe (for “Refresh status” after signup). **Body:** none.

**Response:** `200 OK`

```json
{
  "data": {
    "status": "active",
    "planId": "pro"
  }
}
```

**Errors:** `401`, `500`.

---

## 11. Onboarding

### POST /api/onboard/complete

Complete onboarding: create default journal, first entry, set preferences and notification, set `onboardingComplete` and optional `prefferdName`.

**Body:**

```json
{
  "firstEntryContent": "string (required)",
  "journalName": "My Journal",
  "displayName": "string | null",
  "goal": "string | null",
  "topics": "string | null",
  "reason": "string | null",
  "dailyReminderTime": "20:30",
  "dailyReminderEnabled": true
}
```

**Response:** `201 Created`

```json
{
  "data": {
    "journalId": 1,
    "entryId": 1
  }
}
```

**Errors:** `400` if `firstEntryContent` missing, `500`.

---

## 12. Journal chat (AI)

### POST /api/journals/[id]/chat

Send a message to the journal-context AI coach. Backend has access to that journal’s recent entries. Returns assistant reply and session id for follow-up.

**Path:** `id` — journal ID.

**Body:**

```json
{
  "message": "string (required)",
  "sessionId": 5
}
```

Omit `sessionId` for a new conversation; use returned `sessionId` for follow-up messages.

**Response:** `200 OK`

```json
{
  "data": {
    "reply": "Based on your recent entries...",
    "sessionId": 5
  }
}
```

**Errors:** `400` (missing message, invalid journal id), `404`, `502`.

---

## 13. Webhooks

### POST /api/webhooks/stripe

Stripe webhook. **Not called by the app.** Stripe sends events here. Backend verifies `Stripe-Signature` and processes `checkout.session.completed`, `customer.subscription.*`. No auth; verification via webhook secret. **Response:** `200 OK` on success; `4xx` on invalid signature.

---

## 14. Quick reference table

| Method | Path                                  | Purpose                            |
| ------ | ------------------------------------- | ---------------------------------- |
| GET    | `/api/journals`                       | List journals                      |
| POST   | `/api/journals`                       | Create journal                     |
| GET    | `/api/journals/[id]`                  | Get journal                        |
| PATCH  | `/api/journals/[id]`                  | Update journal                     |
| DELETE | `/api/journals/[id]`                  | Delete journal                     |
| GET    | `/api/journals/[id]/entries`          | List entries (sort, limit, offset) |
| POST   | `/api/journals/[id]/entries`          | Create entry                       |
| POST   | `/api/journals/[id]/chat`             | Chat (AI) with journal context     |
| GET    | `/api/entries/[id]`                   | Get entry                          |
| PATCH  | `/api/entries/[id]`                   | Update entry                       |
| DELETE | `/api/entries/[id]`                   | Delete entry                       |
| PUT    | `/api/entries/[id]/mood`              | Set entry mood                     |
| POST   | `/api/entries/[id]/tags`              | Add tag                            |
| DELETE | `/api/entries/[id]/tags/[tag]`        | Remove tag                         |
| POST   | `/api/entries/[id]/regenerate-ai`     | AI summary/mood/tags/score         |
| POST   | `/api/entries/[id]/go-deeper`         | Get reflection questions           |
| GET    | `/api/moods`                          | List moods                         |
| POST   | `/api/moods`                          | Create mood                        |
| GET    | `/api/moods/[id]`                     | Get mood                           |
| PATCH  | `/api/moods/[id]`                     | Update mood                        |
| DELETE | `/api/moods/[id]`                     | Delete mood                        |
| GET    | `/api/users/me/entries`               | List all entries (from, to, limit) |
| GET    | `/api/users/me/preferences`           | Get preferences                    |
| PATCH  | `/api/users/me/preferences`           | Update preferences                 |
| GET    | `/api/users/me/notification`          | Get notification settings          |
| PATCH  | `/api/users/me/notification`          | Update notification                |
| GET    | `/api/users/me/stats`                 | Stats & Lumina level               |
| GET    | `/api/users/me/subscription`          | Subscription status                |
| DELETE | `/api/users/me/journals`              | Delete all journal data            |
| DELETE | `/api/users/me/ai-data`               | Delete AI data                     |
| POST   | `/api/users/me/delete-all-data`       | Delete all user data               |
| GET    | `/api/users/me/reminders`             | List reminders (from, to)          |
| POST   | `/api/users/me/reminders`             | Create reminder                    |
| PATCH  | `/api/users/me/reminders/[id]`        | Update reminder                    |
| DELETE | `/api/users/me/reminders/[id]`        | Delete reminder                    |
| GET    | `/api/users/me/weekly-tips`           | List weekly tips                   |
| POST   | `/api/users/me/weekly-tips/generate`  | Generate weekly tip                |
| PATCH  | `/api/users/me/weekly-tips/[id]/read` | Mark tip read                      |
| POST   | `/api/billing/checkout`               | Create checkout session            |
| POST   | `/api/billing/portal`                 | Create portal session              |
| POST   | `/api/billing/sync`                   | Sync subscription from Stripe      |
| POST   | `/api/onboard/complete`               | Complete onboarding                |
| POST   | `/api/webhooks/stripe`                | Stripe webhook (no auth)           |

All routes except `/api/webhooks/stripe` require authentication.
