# State Management & Caching Checklist

Comprehensive checklist for the Lumina app’s **state** and **caching** layer. All API reads go through a central cache; mutations invalidate the right keys so the UI stays consistent.

---

## 1. Cache layer (implementation status)

| Item | Status | Location / Notes |
|------|--------|------------------|
| Central in-memory cache with TTL | ✅ | `lib/cache.ts`: `getOrFetch`, `invalidateKey`, `invalidatePrefix`, `clearAll` |
| Query key builders | ✅ | `lib/query-keys.ts`: keys for journals, entries, moods, reminders, preferences, etc. |
| TTL constants per resource | ✅ | `CACHE_TTL`: JOURNALS_MS 2m, ENTRIES_MS 1m, MOODS_MS 1m, REMINDERS_MS 1m, PREFERENCES_MS 5m, USER_MS 2m, WEEKLY_TIPS_MS 2m |
| In-flight request deduplication | ✅ | `getOrFetch` in `lib/cache.ts` deduplicates concurrent same-key requests |
| Prefix invalidation | ✅ | `invalidatePrefix(prefix)` clears all keys matching prefix (e.g. `journalEntries:4`) |

---

## 2. useApi integration (cache on read, invalidate on write)

| API method | Cache read | Invalidation on mutation |
|------------|------------|---------------------------|
| fetchJournals | ✅ `journals` (2m) | createJournal, updateJournal, deleteJournal → journals, journal:id |
| fetchJournal(id) | ✅ `journal:id` (2m) | updateJournal, deleteJournal → journal:id |
| fetchJournalEntries(journalId, opts) | ✅ `journalEntries:jid:sort:limit[:offset]` (1m) | createEntry, updateEntry, deleteEntry → journalEntries:, myEntries: |
| fetchMyEntries(limit, from?, to?) | ✅ `myEntries:limit` or `myEntries:limit:from:to` (1m) | createEntry, updateEntry, deleteEntry, setEntryMood, addEntryTag, removeEntryTag, regenerateEntryAi |
| fetchEntry(entryId) | ✅ `entry:entryId` (1m) | updateEntry, deleteEntry, setEntryMood, addEntryTag, removeEntryTag, regenerateEntryAi |
| fetchMoods(opts) | ✅ `moods:limit[:offset]` (1m) | createMood, updateMood, deleteMood → moods |
| fetchReminders(from?, to?) | ✅ `reminders` or `reminders:from:to` (1m) | createReminder, updateReminder, deleteReminder → reminders |
| fetchPreferences | ✅ `preferences` (5m) | updatePreferences |
| fetchNotification | ✅ `notification` (5m) | updateNotification |
| fetchUserStats | ✅ `userStats` (2m) | — (no direct mutation from app) |
| fetchSubscription | ✅ `subscription` (2m) | syncBilling |
| fetchWeeklyTips(limit) | ✅ `weeklyTips:limit` (2m) | generateWeeklyTip, markWeeklyTipRead → weeklyTips: |
| createEntry | — | Invalidates journalEntries:, myEntries:, journals |
| deleteMyJournalData / deleteAllMyData | — | `clearAll()` |

---

## 3. Refetch / pull-to-refresh

`useApi()` returns **`invalidate`** so screens can force a refetch:

- `api.invalidate.journals()` then `api.fetchJournals()`
- `api.invalidate.myEntries()` then `api.fetchMyEntries(100)`
- `api.invalidate.journalEntries(journalId)` then `api.fetchJournalEntries(journalId, opts)`
- `api.invalidate.entry(entryId)` then `api.fetchEntry(entryId)`
- `api.invalidate.moods()` then `api.fetchMoods()`
- `api.invalidate.reminders()` then `api.fetchReminders()`
- `api.invalidate.preferences()` / `api.invalidate.notification()`
- `api.invalidate.userStats()` / `api.invalidate.subscription()`
- `api.invalidate.weeklyTips()`
- `api.invalidate.all()` — clears entire cache (also called on sign out)

---

## 4. Sign out and data deletion

| Action | Cache behavior |
|--------|----------------|
| Sign out (SignOutButton) | ✅ `clearAll()` before `signOut()` — `components/sign-out-button.tsx` |
| Delete all journal data | ✅ `clearAll()` after API success — `deleteMyJournalData` in use-api |
| Delete all user data | ✅ `clearAll()` after API success — `deleteAllMyData` in use-api |

---

## 5. Screen-by-screen state & data

### 5.1 Home (`app/(home)/(tabs)/index.tsx`)

| State | Source | Cached? |
|-------|--------|--------|
| totalJournals, entriesThisWeek, entriesForSelectedDay, journaledDaysThisWeek | fetchJournals + fetchMyEntries(100) | ✅ Both cached |
| lastJournalEntry, dashboardOverrides, recentMoodSummary | Derived from my entries | N/A |
| latestWeeklyTip, weeklyTipsLoading, weeklyTipGenerating | fetchWeeklyTips(1), generateWeeklyTip | ✅ List cached |
| selectedDate, showWeekStrip, journalPickerVisible | Local UI state | — |

**Refetch:** Change `selectedDate` triggers same effect; no extra refetch needed. For pull-to-refresh (if added), call `api.invalidate.myEntries()` + `api.invalidate.journals()` + `api.invalidate.weeklyTips()` then re-run effect.

---

### 5.2 Journals tab (`app/(home)/(tabs)/journals.tsx`)

| State | Source | Cached? |
|-------|--------|--------|
| journals list | fetchJournals() on focus | ✅ |
| loading, error | Local | — |

---

### 5.3 Journal detail (`app/(home)/journal/[id].tsx`)

| State | Source | Cached? |
|-------|--------|--------|
| journal, entries | fetchJournal(id), fetchJournalEntries(id, { sort }) | ✅ Both |
| sort, searchQuery, sortMenuVisible, creating | Local | — |

**Invalidation:** createEntry navigates to entry screen; when user comes back, next focus will refetch (or use cached if TTL not expired). To force refresh after returning: `api.invalidate.journalEntries(id)` then load.

---

### 5.4 Entry screen (`app/(home)/entry/[entryId].tsx`)

| State | Source | Cached? |
|-------|--------|--------|
| entry (content, etc.) | fetchEntry(entryId) | ✅ |
| AI summary, mood, tags, go-deeper questions | regenerateEntryAi, goDeeper (no cache) | — |
| Local edits (content), saving | updateEntry | Invalidates entry + journal entries + my entries |

---

### 5.5 Calendar (`app/(home)/calendar.tsx`)

| State | Source | Cached? |
|-------|--------|--------|
| sections | useCalendarData(mode, fetchMyEntries, fetchReminders) | ✅ Both fetchers cached |
| mode, addSheetVisible, filterVisible, showPastEntries | Local | — |

**Refetch:** Pull-to-refresh calls `refetch()` in useCalendarData, which re-calls fetchMyEntries and fetchReminders (cache can still return stale; to force fresh: `api.invalidate.myEntries()` + `api.invalidate.reminders()` then refetch).

---

### 5.6 AI Chat (`app/(home)/(tabs)/ai-chat.tsx`)

| State | Source | Cached? |
|-------|--------|--------|
| journals | fetchJournals() on focus | ✅ |
| selectedJournal, sessionId, messages, input, sending | Local / API (chat not cached) | — |

---

### 5.7 Mood screen (`app/(home)/mood.tsx`)

| State | Source | Cached? |
|-------|--------|--------|
| Journals for picker, entries for linking | fetchJournals, fetchMyEntries(100) | ✅ |
| Mood log form, selected journal | Local | — |

---

### 5.8 Insight section (`components/insight-section.tsx`)

| State | Source | Cached? |
|-------|--------|--------|
| generalMoods | fetchMoods({ limit: 30 }) on focus | ✅ |
| lastJournalEntry, entriesThisWeek, etc. | Props from Home | — |
| Mood modal (title, note, submitting) | Local | — |

---

### 5.9 App settings (`app/(home)/app-settings.tsx`)

| State | Source | Cached? |
|-------|--------|--------|
| preferences, notification | fetchPreferences(), fetchNotification() on load | ✅ |
| Theme, reminder toggles, time, timezone, frequency | updatePreferences, updateNotification | Invalidates preferences / notification |

---

### 5.10 Privacy settings (`app/(home)/privacy-settings.tsx`)

| State | Source | Cached? |
|-------|--------|--------|
| delete loading states | Local | — |
| deleteMyJournalData, deleteMyAiData, deleteAllMyData | API; deleteAll + signOut clear cache | ✅ clearAll on delete all / journals |

---

### 5.11 Subscription (`app/(home)/subscription.tsx`)

| State | Source | Cached? |
|-------|--------|--------|
| checkout/portal URLs | createCheckoutSession, createPortalSession (no cache) | — |
| Optional: subscription status | fetchSubscription | ✅ |

---

### 5.12 Create journal (`app/(home)/create-journal.tsx`)

| State | Source | Cached? |
|-------|--------|--------|
| title input, loading | Local | — |
| createJournal | Invalidates journals | ✅ |

---

### 5.13 Explore (`app/(home)/(tabs)/explore.tsx`)

| State | Source | Cached? |
|-------|--------|--------|
| createEntry, fetchJournals (for picker) | Cached journals; createEntry invalidates | ✅ |

---

### 5.14 More tab (`app/(home)/(tabs)/more.tsx`)

| State | Source | Cached? |
|-------|--------|--------|
| Navigation, SignOutButton | clearAll on sign out | ✅ |

---

## 6. Contexts (non-API state)

| Context | Storage | Purpose |
|---------|---------|--------|
| ThemeContext | System / user preference | Light / dark / system |
| DashboardSettingsContext | AsyncStorage `@lumina/dashboard-settings` | Dashboard card order and visibility |

These are independent of the API cache. Preferences and notification from the API are cached as above.

---

## 7. Checklist summary

- [x] **lib/query-keys.ts** — Key builders and TTLs
- [x] **lib/cache.ts** — getOrFetch, invalidateKey, invalidatePrefix, clearAll
- [x] **hooks/use-api.ts** — All fetchers use cache; mutations invalidate; `invalidate` object exposed
- [x] **Sign out** — clearAll() in SignOutButton
- [x] **Delete all / delete journals** — clearAll() after API success
- [x] **Screens** — Use useApi() only; no extra cache wiring (cache is inside useApi)

For **pull-to-refresh** on a screen: call the relevant `api.invalidate.*()` then the same `api.fetch*()` that the screen uses; or rely on TTL (1–5 min) for natural refresh.
