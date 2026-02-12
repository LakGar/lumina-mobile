# Lumina Mobile — Safety Checklist

Use this checklist to keep the app **secure**, **safe for user data**, and **resilient**. Items marked ✅ are implemented; others are guidelines or optional hardening.

---

## 1. Authentication & tokens

| Item | Status | Notes |
|------|--------|--------|
| Auth via Clerk (Bearer token) | ✅ | All API requests use `getToken()`; no tokens in code or env |
| Token not logged or exposed | ✅ | Token only in Authorization header; never in console or error messages |
| Sign out clears local cache | ✅ | `clearAll()` in SignOutButton before signOut() |
| .env not committed | ✅ | `.gitignore` includes `.env`, `.env*.local` |

---

## 2. Environment & secrets

| Item | Status | Notes |
|------|--------|--------|
| Only public env vars prefixed with EXPO_PUBLIC_ | ✅ | EXPO_PUBLIC_CLERK_*, EXPO_PUBLIC_API_URL |
| No secrets in .env.example | ✅ | Placeholder values only |
| No API keys or secrets in source | ✅ | Keys come from env; backend holds server secrets |

---

## 3. Opening external URLs

| Item | Status | Notes |
|------|--------|--------|
| Validate URL before WebBrowser.openBrowserAsync | ✅ | `lib/safe-url.ts`: allow only https (or http for dev); block javascript:, data:, etc. |
| Use safe URL in My Account (Clerk portal) | ✅ | getClerkAccountUrl() + isSafeExternalUrl() before open |
| Use safe URL in Subscription (checkout/portal) | ✅ | Check URL from API before opening |

---

## 4. Input validation & injection

| Item | Status | Notes |
|------|--------|--------|
| Route params (entryId, journalId, id) validated | ✅ | `lib/validate-ids.ts`: non-empty, safe chars (numeric/alphanumeric), max length |
| Entry/journal content length bounded by API | ✅ | Backend enforces limits; app can pass through |
| No dangerouslySetInnerHTML with user content | ✅ | No raw HTML from user; editor content sanitized/plain text where needed |
| Tag/mood strings not executed as code | ✅ | Sent as JSON; no eval or script injection |

---

## 5. Destructive actions — confirmations

| Item | Status | Notes |
|------|--------|--------|
| Delete all journal data | ✅ | Privacy settings: Alert with title/message, Cancel + Delete |
| Delete AI data | ✅ | Privacy settings: same pattern |
| Delete all user data | ✅ | Privacy settings: strong warning, then sign out |
| Delete single journal | ⚠️ | Add confirmation before deleteJournal if UI exposes it |
| Delete single entry | ⚠️ | Add confirmation before deleteEntry if UI exposes it |

---

## 6. Error handling & resilience

| Item | Status | Notes |
|------|--------|--------|
| App-level Error Boundary | ✅ | Catches render errors; shows fallback UI and "Try again" |
| API errors not exposing stack or internals | ✅ | ApiError message from backend or generic "Request failed" |
| 401 → redirect to sign-in / refresh | ✅ | Handled by Clerk / app flow |
| No sensitive data in console in production | ✅ | Safe logger: redact or omit in prod builds |

---

## 7. Data & privacy

| Item | Status | Notes |
|------|--------|--------|
| User content only sent to own backend | ✅ | EXPO_PUBLIC_API_URL; no third-party analytics with content |
| AsyncStorage keys namespaced | ✅ | e.g. @lumina/..., @privacy/... |
| Cache cleared on sign out and delete-all | ✅ | clearAll() in use-api and SignOutButton |

---

## 8. Dependencies & build

| Item | Status | Notes |
|------|--------|--------|
| No known high/critical vulnerabilities | ⚠️ | Run `npm audit` periodically |
| HTTPS in production for API | ⚠️ | Ensure EXPO_PUBLIC_API_URL is https in prod |

---

## Quick reference — implemented modules

- **lib/safe-url.ts** — `isSafeExternalUrl(url)`, `getSafeExternalUrl(url)`: allow only http(s); used before WebBrowser.openBrowserAsync in My Account and Subscription.
- **lib/validate-ids.ts** — `isValidEntryId(id)`, `isValidJournalId(id)`, `sanitizeId(id)`: used for entry and journal route params.
- **components/error-boundary.tsx** — `<ErrorBoundary>` wraps root in `app/_layout.tsx`; shows "Something went wrong" + Try again.
- **lib/safe-log.ts** — `safeLogError(message, error)`: in __DEV__ logs message/stack; in production no-op. Used in SignOutButton; use in auth screens to avoid logging full error objects.

Use this checklist in code review and before releases.
