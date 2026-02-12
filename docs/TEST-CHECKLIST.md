# Lumina Mobile — Test Checklist

Use this checklist to confirm the app is working end-to-end. **Automated** tests run with `npm test`; **manual** flows are for QA before release.

---

## 1. Automated unit tests (run: `npm test`)

### 1.1 Lib: safe-url

| Test                                                               | Status |
| ------------------------------------------------------------------ | ------ |
| `isSafeExternalUrl` returns true for https URL                     | ✅     |
| `isSafeExternalUrl` returns true for http URL                      | ✅     |
| `isSafeExternalUrl` returns false for null/undefined/empty         | ✅     |
| `isSafeExternalUrl` returns false for javascript: URL              | ✅     |
| `isSafeExternalUrl` returns false for data: URL                    | ✅     |
| `getSafeExternalUrl` returns trimmed URL when safe, null otherwise | ✅     |

### 1.2 Lib: validate-ids

| Test                                                        | Status |
| ----------------------------------------------------------- | ------ |
| `isValidEntryId` accepts numeric string                     | ✅     |
| `isValidEntryId` accepts alphanumeric and hyphen/underscore | ✅     |
| `isValidEntryId` rejects null/undefined/empty               | ✅     |
| `isValidEntryId` rejects over max length                    | ✅     |
| `isValidEntryId` rejects unsafe characters                  | ✅     |
| `isValidJournalId` same as isValidEntryId                   | ✅     |
| `sanitizeId` returns trimmed id or null                     | ✅     |

### 1.3 Lib: cache

| Test                                                          | Status |
| ------------------------------------------------------------- | ------ |
| `getOrFetch` returns fetcher result and caches it             | ✅     |
| Second `getOrFetch` with same key returns cached (within TTL) | ✅     |
| `invalidateKey` causes next getOrFetch to refetch             | ✅     |
| `invalidatePrefix` removes keys matching prefix               | ✅     |
| `clearAll` clears store                                       | ✅     |

### 1.4 Lib: query-keys

| Test                                                          | Status |
| ------------------------------------------------------------- | ------ |
| Key builders return expected key strings                      | ✅     |
| Cache key for journal entries includes journalId, sort, limit | ✅     |

### 1.5 Utils: date

| Test                                               | Status |
| -------------------------------------------------- | ------ |
| `formatYYYYMMDD` returns YYYY-MM-DD                | ✅     |
| `addDays` adds n days correctly                    | ✅     |
| `startOfWeek` returns Monday when mondayStart true | ✅     |
| `isToday` true for today only                      | ✅     |
| `formatTime` returns 12h AM/PM format              | ✅     |

---

## 2. Manual smoke tests (critical paths)

Run these with the app and backend running; user signed in.

### 2.1 Auth & navigation

| Step | Action                                             | Expected                        |
| ---- | -------------------------------------------------- | ------------------------------- |
| 1    | Open app (signed out)                              | Welcome or sign-in screen       |
| 2    | Sign in with email/password                        | Home tab visible                |
| 3    | Tap each tab (Home, Explore, Journals, More, Chat) | Each screen loads without crash |
| 4    | Sign out from More                                 | Back to auth/welcome            |

### 2.2 Journals & entries

| Step | Action                                               | Expected                                 |
| ---- | ---------------------------------------------------- | ---------------------------------------- |
| 5    | Journals tab → Create journal (if empty) or open one | Journal list or detail loads             |
| 6    | Open a journal → tap new entry (or +)                | Entry screen opens, can type             |
| 7    | Type content → leave or save                         | Draft or save works; no crash            |
| 8    | Back to journal                                      | Entry appears in list (or after refresh) |

### 2.3 Home & insight

| Step | Action                                | Expected                                            |
| ---- | ------------------------------------- | --------------------------------------------------- | ----- |
| 9    | Home tab                              | Dashboard, insight section, weekly tip card visible |
| 10   | Tap “Get your weekly tip” (if no tip) | Loading then tip or error message                   |
| 11   | Tap “Log mood” (insight)              | Modal opens; save mood                              | Works |

### 2.4 AI Chat

| Step | Action                               | Expected                        |
| ---- | ------------------------------------ | ------------------------------- |
| 12   | Chat tab                             | Journal picker or chat UI       |
| 13   | Select journal → type message → Send | “Thinking…” then reply or error |

### 2.5 Settings & account

| Step | Action                  | Expected                                      |
| ---- | ----------------------- | --------------------------------------------- |
| 14   | More → App settings     | Preferences/notification load                 |
| 15   | More → My account       | Edit/Email/Password open browser if URL set   |
| 16   | More → Privacy settings | Delete options show; confirm flow shows Alert |

### 2.6 Subscription (if backend configured)

| Step | Action                        | Expected                                                               |
| ---- | ----------------------------- | ---------------------------------------------------------------------- |
| 17   | Upgrade / Subscription screen | Upgrade opens Stripe checkout; Manage opens portal (or friendly error) |

---

## 3. Error & safety checks

| Check                   | How to verify                                                            |
| ----------------------- | ------------------------------------------------------------------------ |
| Invalid entry ID in URL | Navigate to entry/xyz123invalid → “Entry not found” or similar, no crash |
| Invalid journal ID      | Same for journal/xyzinvalid                                              |
| No API / network error  | Turn off backend or network → app shows errors, no white screen          |
| Error boundary          | Force a render error in dev → “Something went wrong” + Try again         |

---

## 4. Running tests

```bash
# Unit tests
npm test

# Lint
npm run lint
```

---

## 5. Adding new tests

- **Unit:** Add `*.test.ts` or `*.test.tsx` next to the module or in `__tests__/`.
- **Manual:** Add a row to section 2 or 3 and run before release.
