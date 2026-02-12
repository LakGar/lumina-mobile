# App Store Ready – Checklist & Backend API Notes

Use this checklist to track progress toward a shippable build. Items are marked when implemented in the app; backend-only work is called out separately.

---

## Home & Create Entry

- [x] **Create entry (floating button)** – Tapping opens a **journal select** dialog. User picks a journal (or “Create new journal”), then app creates an entry in that journal and navigates to the entry screen.
- [x] **Write entry (Insight section)** – Same flow: journal picker → create entry with selected journal → open entry screen.
- [x] **Prompt of the day / Start journaling with prompt** – Opens journal picker; on select, creates entry with that prompt as initial content.
- [x] **Journal select modal** – Lists journals from API; “Create new journal” navigates to create-journal screen. Empty state shows “Create journal” CTA.

---

## Dashboard & Insights

- [x] **Dashboard – Entries this week** – Value comes from API (computed from `fetchMyEntries` for current week).
- [x] **Dashboard – Total journals** – Value comes from API (`fetchJournals().length`).
- [x] **Dashboard – Selected date** – Label reflects active day (e.g. “Today”, “Yesterday”) when viewing “Entries this week”.
- [ ] **Dashboard – Other metrics** – Entry quality score, mood score, streak, reflections, gratitude, words per entry, consistency, prompts completed still use **static defaults**. Backend API needed to drive these (see Backend APIs below).
- [x] **Insights – Entries this week** – Uses real count from home when provided.
- [ ] **Insights – Last journal, Lumina level, week bar** – Still use mock/placeholder data. Backend API needed for “last journal” and level/streak (see Backend APIs below).

---

## More Page & Sub-pages

- [x] **Upgrade / Membership card** – Navigates to **Subscription** screen (placeholder for billing/plans).
- [x] **Gift a membership** – Navigates to **Gift membership** screen (functional UI; backend for sending invites TBD).
- [x] **My account** – Navigates to **My account** screen.
- [x] **App settings** – Navigates to **App settings** (preferences + notifications wired to API).
- [x] **Privacy settings** – Navigates to **Privacy settings** screen.
- [x] **Membership services** – Navigates to **Membership & support** screen (links to app settings, help URL, contact email).
- [x] **Tutorial** – Navigates to **Tutorial** screen (in-app tips).
- [x] **About** – Navigates to **About** screen (app name, version, privacy/terms links).

---

## Journals & Entries

- [x] **Journals tab** – Fetches and lists journals from API; create journal → create-journal screen.
- [x] **Journal detail** – Fetches journal + entries; create entry → journal picker not required (journal already chosen); creates entry and navigates to entry screen.
- [x] **Entry screen** – Loads entry from API; save on back and on app background; local draft in AsyncStorage.
- [x] **Create journal** – POST to API, then navigate to new journal detail.

---

## Explore & Other Tabs

- [x] **Explore – Start journaling from prompts/topics** – Uses journal picker (same as home) when starting from Prompt of the day, Journal of the day, topic pills, discover cards, trending prompts.
- [x] **AI chat** – Navigates to chat tab (functionality as implemented).
- [x] **Calendar** – Navigates to calendar screen; entry cards open entry by ID.

---

## Backend APIs to Add (for full parity)

These are **not** yet implemented on the backend; the app uses placeholders or static data where noted.

1. **User stats / dashboard aggregates**
   - **Purpose:** Drive “Entry quality score”, “Mood score”, “Current streak”, “Reflections”, “Gratitude entries”, “Words per entry”, “Consistency”, “Prompts completed” with real values.
   - **Suggested:** e.g. `GET /api/users/me/stats` or `GET /api/users/me/dashboard` returning counts and averages per period (week, month) and streak.

2. **Insights – “Last journal”**
   - **Purpose:** Show last journaled entry title and “X days ago”.
   - **Suggested:** Either from existing `GET /api/users/me/entries?limit=1` (already used for “Previous entry”) or a dedicated “last activity” field in user/stats.

3. **Lumina level / tier and points**
   - **Purpose:** Replace mock tier and “1,345pts to Gold” in Insights.
   - **Suggested:** e.g. `GET /api/users/me/level` or include in user profile: `level`, `tier`, `points`, `pointsToNextTier`.

4. **Subscription / billing**
   - **Purpose:** Subscription screen and “Upgrade membership” to show real plans, status, restore.
   - **Suggested:** Endpoints for plans, current subscription status, restore purchases; integrate with App Store / Play Billing.

5. **Gift membership / referrals**
   - **Purpose:** Send invite and track referral state from Gift membership screen.
   - **Suggested:** e.g. `POST /api/referrals/invite` (email), `GET /api/referrals` for list; optional referral rewards logic.

6. **Support / config**
   - **Purpose:** Optional: drive “Help center” URL, “Contact support” email, “Privacy policy” / “Terms” URLs from backend or config so they can change without app update.

---

## Optional / Polish

- [ ] **Streak** – Tab header shows streak only when ≥ 2 days; value currently passed as `0` from home. Wire to backend streak when stats API exists.
- [ ] **Refer and earn cards (More)** – Currently UI only; wire to referral API when available.
- [ ] **Deep links** – If you need entry/journal deep links (e.g. from notifications), add routing and backend link format.
- [ ] **Error boundaries & offline** – Improve offline messaging and retry UX where needed.
- [ ] **Analytics & crash reporting** – Add before release if required.
- [ ] **App icons & splash** – Ensure production assets and correct bundle ID for store.

---

## Summary

- **Done in app:** Journal select for Create/Write entry, dashboard entries-this-week and total-journals from API, More sub-pages (subscription, tutorial, about, membership-services) navigable and functional at UI level.
- **Still placeholder/mock:** Dashboard metrics (quality, mood, streak, etc.), Insights tier/last journal, subscription billing, gift/referral backend.
- **Backend work:** Stats/dashboard API, level/tier API, subscription/billing, referral API, and optional config for support/legal URLs.

Update this file as you implement each item or add new backend endpoints.
