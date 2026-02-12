# Lumina API Routes Checklist

Checklist derived from **docs/API-REFERENCE-FRONTEND.md**. Use this to confirm every route is implemented in `lib/api.ts`, exposed in `hooks/use-api.ts`, and used where needed in the app.

**Legend**

- **API**: Implemented in `lib/api.ts`
- **Hook**: Exposed on `useApi()` in `hooks/use-api.ts`
- **Used**: Main app usage (screen or flow)

---

## 1. Journals

| Method | Path | API function | Hook | Used in app |
|--------|------|--------------|------|-------------|
| GET | `/api/journals` | `fetchJournals` | ✅ fetchJournals | Home, Journals tab, journal picker, AI chat picker |
| POST | `/api/journals` | `createJournal` | ✅ createJournal | Create journal flow |
| GET | `/api/journals/[id]` | `fetchJournal` | ✅ fetchJournal | Journal detail, entry flows |
| PATCH | `/api/journals/[id]` | `updateJournal` | ✅ updateJournal | Edit journal |
| DELETE | `/api/journals/[id]` | `deleteJournal` | ✅ deleteJournal | Delete journal |

---

## 2. Journal entries (by journal)

| Method | Path | API function | Hook | Used in app |
|--------|------|--------------|------|-------------|
| GET | `/api/journals/[id]/entries` | `fetchJournalEntries` | ✅ fetchJournalEntries | Journal detail list (sort, limit, offset) |
| POST | `/api/journals/[id]/entries` | `createEntry` | ✅ createEntry | New entry, quick add |

---

## 3. Entries (by ID)

| Method | Path | API function | Hook | Used in app |
|--------|------|--------------|------|-------------|
| GET | `/api/entries/[id]` | `fetchEntry` | ✅ fetchEntry | Entry screen |
| PATCH | `/api/entries/[id]` | `updateEntry` | ✅ updateEntry | Edit entry |
| DELETE | `/api/entries/[id]` | `deleteEntry` | ✅ deleteEntry | Delete entry |
| PUT | `/api/entries/[id]/mood` | `setEntryMood` | ✅ setEntryMood | Entry mood (per-entry) |
| POST | `/api/entries/[id]/tags` | `addEntryTag` | ✅ addEntryTag | Entry tags |
| DELETE | `/api/entries/[id]/tags/[tag]` | `removeEntryTag` | ✅ removeEntryTag | Remove tag |
| POST | `/api/entries/[id]/regenerate-ai` | `regenerateEntryAi` | ✅ regenerateEntryAi | Entry screen “Generate AI” |
| POST | `/api/entries/[id]/go-deeper` | `goDeeper` | ✅ goDeeper | Entry screen “Go deeper” |

---

## 4. Moods (standalone)

| Method | Path | API function | Hook | Used in app |
|--------|------|--------------|------|-------------|
| GET | `/api/moods` | `fetchMoods` | ✅ fetchMoods | Insight section mood card |
| POST | `/api/moods` | `createMood` | ✅ createMood | Log mood modal |
| GET | `/api/moods/[id]` | `fetchMood` | ✅ fetchMood | Mood detail (when needed) |
| PATCH | `/api/moods/[id]` | `updateMood` | ✅ updateMood | Edit mood (when needed) |
| DELETE | `/api/moods/[id]` | `deleteMood` | ✅ deleteMood | Delete mood (when needed) |

---

## 5. User: entries, preferences, notification

| Method | Path | API function | Hook | Used in app |
|--------|------|--------------|------|-------------|
| GET | `/api/users/me/entries` | `fetchMyEntries` | ✅ fetchMyEntries | Home stats, calendar, dashboard |
| GET | `/api/users/me/preferences` | `fetchPreferences` | ✅ fetchPreferences | Settings, onboarding |
| PATCH | `/api/users/me/preferences` | `updatePreferences` | ✅ updatePreferences | Customize dashboard, settings |
| GET | `/api/users/me/notification` | `fetchNotification` | ✅ fetchNotification | App settings / notifications |
| PATCH | `/api/users/me/notification` | `updateNotification` | ✅ updateNotification | Notification settings |

---

## 6. User: stats, subscription

| Method | Path | API function | Hook | Used in app |
|--------|------|--------------|------|-------------|
| GET | `/api/users/me/stats` | `fetchUserStats` | ✅ fetchUserStats | Dashboard, insights (Lumina level/score) |
| GET | `/api/users/me/subscription` | `fetchSubscription` | ✅ fetchSubscription | Subscription / upgrade UI |

---

## 7. User: privacy & data deletion

| Method | Path | API function | Hook | Used in app |
|--------|------|--------------|------|-------------|
| DELETE | `/api/users/me/journals` | `deleteMyJournalData` | ✅ deleteMyJournalData | Privacy settings |
| DELETE | `/api/users/me/ai-data` | `deleteMyAiData` | ✅ deleteMyAiData | Privacy settings |
| POST | `/api/users/me/delete-all-data` | `deleteAllMyData` | ✅ deleteAllMyData | Privacy settings (then sign out) |

---

## 8. User: reminders

| Method | Path | API function | Hook | Used in app |
|--------|------|--------------|------|-------------|
| GET | `/api/users/me/reminders` | `fetchReminders` | ✅ fetchReminders | Calendar, reminders UI |
| POST | `/api/users/me/reminders` | `createReminder` | ✅ createReminder | Add reminder |
| PATCH | `/api/users/me/reminders/[id]` | `updateReminder` | ✅ updateReminder | Edit reminder |
| DELETE | `/api/users/me/reminders/[id]` | `deleteReminder` | ✅ deleteReminder | Delete reminder |

---

## 9. User: weekly tips

| Method | Path | API function | Hook | Used in app |
|--------|------|--------------|------|-------------|
| GET | `/api/users/me/weekly-tips` | `fetchWeeklyTips` | ✅ fetchWeeklyTips | Home weekly tip card |
| POST | `/api/users/me/weekly-tips/generate` | `generateWeeklyTip` | ✅ generateWeeklyTip | “Get your weekly tip” |
| PATCH | `/api/users/me/weekly-tips/[id]/read` | `markWeeklyTipRead` | ✅ markWeeklyTipRead | After opening tip detail |

---

## 10. Billing

| Method | Path | API function | Hook | Used in app |
|--------|------|--------------|------|-------------|
| POST | `/api/billing/checkout` | `createCheckoutSession` | ✅ createCheckoutSession | Upgrade / subscription page |
| POST | `/api/billing/portal` | `createPortalSession` | ✅ createPortalSession | Manage subscription |
| POST | `/api/billing/sync` | `syncBilling` | ✅ syncBilling | After checkout return (refresh status) |

---

## 11. Onboarding

| Method | Path | API function | Hook | Used in app |
|--------|------|--------------|------|-------------|
| POST | `/api/onboard/complete` | `completeOnboarding` | ✅ completeOnboarding | Onboarding completion flow |

---

## 12. Journal chat (AI)

| Method | Path | API function | Hook | Used in app |
|--------|------|--------------|------|-------------|
| POST | `/api/journals/[id]/chat` | `sendJournalChat` | ✅ sendJournalChat | AI Chat tab (journal-context chat) |

---

## 13. Webhooks

| Method | Path | API function | Hook | Used in app |
|--------|------|--------------|------|-------------|
| POST | `/api/webhooks/stripe` | — | — | **N/A** (backend only; Stripe calls this) |

---

## Quick verification

- **lib/api.ts**: Every route above (except webhook) has a corresponding `export async function` and uses the path shown.
- **hooks/use-api.ts**: Each of those functions is wrapped in `useCallback` and included in the `useMemo` return object.
- **Usage**: Journals, entries, moods, home, insight section, privacy, subscription, calendar/reminders, AI chat, and onboarding all call the API via `useApi()`.

---

## Backend dependency (500 on journal entries)

If **GET /api/journals/[id]/entries** returns 500 with `EntrySummary.qualityScore` column missing, add the column in the backend and run Prisma migrations. See **docs/BACKEND-ROUTES-NEEDED.md** (Database section).
