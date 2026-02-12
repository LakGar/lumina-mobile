# Calendar & Reminders — API Routes to Implement

The calendar screen uses **user data**: entries from all journals and **scheduled reminders**. To make the calendar fully functional (showing real entries, creating/editing reminders, etc.), implement the following routes.

---

## 1. Entries (for calendar range)

The app already calls **GET `/api/users/me/entries`**. For the calendar it passes optional date filters so the backend can return only entries in the visible week range.

### GET `/api/users/me/entries`

**Purpose:** List the current user's entries across all journals (for home feed and **calendar**).

**Request**

- **Headers:** `Authorization`.
- **Query:**
  - `limit`: number (e.g. 50, 300). Default 50.
  - **`from`** (optional): date string `YYYY-MM-DD` — only return entries with `createdAt` date ≥ this date (in user’s timezone or UTC as you store).
  - **`to`** (optional): date string `YYYY-MM-DD` — only return entries with `createdAt` date ≤ this date.

**Response:** `200 OK`

- Body shape: either `{ "data": entries[] }` or `{ "entries": entries[] }` (app normalizes to `data` in the client).
- Each entry: `id`, `journalId`, `createdAt`, `updatedAt`, `title` (optional), `content` (or `body`), `mood`, `tags`, etc.

If you don’t implement `from`/`to`, the app still works: it requests a large `limit` and filters by date on the client.

---

## 2. Reminders (scheduled journal reminders)

The calendar shows **reminders** per day (e.g. “Morning Pages at 9:00”, “Evening wind-down”). These are user-scoped and keyed by date + time + repeat.

### GET `/api/users/me/reminders`

**Purpose:** List the current user’s reminders, optionally filtered by date range (for calendar).

**Request**

- **Headers:** `Authorization`.
- **Query (optional):**
  - **`from`**: `YYYY-MM-DD` — only reminders for date ≥ this.
  - **`to`**: `YYYY-MM-DD` — only reminders for date ≤ this.

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "string",
      "dateISO": "YYYY-MM-DD",
      "time": "HH:mm",
      "repeat": "none | daily | weekdays | weekly",
      "title": "string",
      "journalId": "string | null",
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)"
    }
  ]
}
```

- `dateISO`: the date this reminder is scheduled for (or start date when repeating).
- `time`: time of day, e.g. `"09:00"`.
- `repeat`: `"none"` (one-off), `"daily"`, `"weekdays"` (Mon–Fri), `"weekly"`.
- `journalId`: optional; which journal to open when user taps “Write” from the reminder.

---

### POST `/api/users/me/reminders`

**Purpose:** Create a new reminder (e.g. from “Schedule reminder” on the calendar).

**Request**

- **Headers:** `Authorization`, `Content-Type: application/json`.
- **Body:**

```json
{
  "dateISO": "YYYY-MM-DD",
  "time": "HH:mm",
  "repeat": "none | daily | weekdays | weekly",
  "title": "string",
  "journalId": "string | null (optional)"
}
```

**Response:** `201 Created` (or `200 OK`) with the created reminder in the same shape as in the list (e.g. in `data` or top-level).

---

### PATCH `/api/users/me/reminders/[id]`

**Purpose:** Update an existing reminder (time, date, repeat, title, journal).

**Request**

- **Path:** `id` — reminder ID.
- **Headers:** `Authorization`, `Content-Type: application/json`.
- **Body (all optional):**

```json
{
  "dateISO": "YYYY-MM-DD",
  "time": "HH:mm",
  "repeat": "none | daily | weekdays | weekly",
  "title": "string",
  "journalId": "string | null"
}
```

**Response:** `200 OK` with updated reminder.

---

### DELETE `/api/users/me/reminders/[id]`

**Purpose:** Delete a reminder (e.g. from long-press or “Reset” for a week).

**Request**

- **Path:** `id` — reminder ID.
- **Headers:** `Authorization`.

**Response:** `204 No Content` or `200 OK`.

---

## 3. Optional: “Reset reminders” for a week

The calendar week header has a **“Reset”** button that currently calls `clearRemindersForWeek(weekKey)`. You can implement this in either of two ways:

- **Option A:** Client calls **DELETE `/api/users/me/reminders/[id]`** for each reminder in that week (after GET with `from`/`to` for that week).
- **Option B:** Add a convenience route, e.g. **DELETE `/api/users/me/reminders?from=YYYY-MM-DD&to=YYYY-MM-DD`** that deletes all reminders in that date range. Then the app calls this with the week’s Monday and Sunday.

---

## 4. Summary table

| Method | Path                                | Purpose                                           |
| ------ | ----------------------------------- | ------------------------------------------------- |
| GET    | `/api/users/me/entries`             | List entries (optional `from`, `to` for calendar) |
| GET    | `/api/users/me/reminders`           | List reminders (optional `from`, `to`)            |
| POST   | `/api/users/me/reminders`           | Create reminder                                   |
| PATCH  | `/api/users/me/reminders/[id]`      | Update reminder                                   |
| DELETE | `/api/users/me/reminders/[id]`      | Delete reminder                                   |
| DELETE | `/api/users/me/reminders?from=&to=` | (Optional) Delete reminders in date range         |

---

## 5. Notification settings (already in use)

The app already uses these for **when** to send the global daily/weekly reminder (settings screen):

- **GET `/api/users/me/notification`** — returns `dailyReminderEnabled`, `dailyReminderTime`, `timezone`, `frequency`, etc.
- **PATCH `/api/users/me/notification`** — update those settings.

Calendar **per-day reminders** are separate: they are the “reminders” resource above (specific date/time/title and optional repeat). Your backend can use them to schedule push notifications or in-app reminders for those dates/times.

---

## 6. App behavior once routes exist

- **Calendar screen:** Loads entries via `GET /api/users/me/entries?limit=300&from=...&to=...` and reminders via `GET /api/users/me/reminders?from=...&to=...`, then builds week sections. Pull-to-refresh refetches.
- **“Add” on a day:** Opens sheet with “Create entry”, “Quick entry”, “Schedule reminder”. Create entry can create an entry in the default journal and navigate to it; “Schedule reminder” can call **POST `/api/users/me/reminders`** with that day’s `dateISO` and a default time/title, then refetch.
- **Tap reminder card:** Can navigate to an edit screen that uses **PATCH** and **DELETE** for that reminder.
- **“Reset” on week header:** Can call **DELETE** for each reminder in that week (or the optional range delete).

Once these routes are implemented and wired in your backend, the calendar will be fully data-driven and support setting up and managing reminders.
