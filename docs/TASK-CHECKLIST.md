# Task Checklist

Use this list to track fixes and features. Check off or edit items as you go; tell the assistant to add/remove items before implementation.

---

## 1. Crashes & errors

- [x] **App settings / theme crash** – Fix `TypeError: Cannot convert undefined value to object` in `use-theme-color.ts` when opening App Settings (and possibly other screens). Cause: `Colors[theme]` can be undefined if `theme` is missing or not `"light"`/`"dark"`. Guard so theme is always `"light"` or `"dark"` (e.g. fallback when `Colors[theme]` is undefined).
- [x] **Create entry 400** – After selecting a journal in the journal picker, `POST /api/journals/2/entries` returns 400. Ensure request body matches backend: `content` required (non-empty string); if backend rejects whitespace-only, send a valid placeholder. Fix so create entry succeeds after journal selection.

---

## 2. More page – buttons not working

- [x] **More tab** – Confirm all buttons in `app/(home)/(tabs)/more.tsx` work: Upgrade card, Gift membership, My account, App settings, Privacy settings, Membership services, Tutorial, About. Fix any that don’t navigate or that trigger the theme crash above.
- [x] Go into each of those (my account, app settings, privacy, membership) and make sure they work.

---

## 3. Insight section – connect to user data

- [x] **Insight cards** – Wire all cards in `components/insight-section.tsx` to real user data (no mocks): Lumina level, Last journal, This week (entries bar), Entries this week. Use API or data passed from parent (e.g. from home’s `fetchMyEntries` / journals).

---

## 4. My dashboard – update all values from data

- [x] **Dashboard metrics** – In `components/my-dashbaord.tsx` and `constants/dashboard-metrics.ts`: ensure every metric’s `value: number` (and where applicable “average”) can be updated from user data. Wire all metrics that have backend or derived data (e.g. entries this week, total journals, and any others available from API or local computation).

---

## 5. Mood – card, page, history, trends

- [x] **Insight mood card** – Add a “Mood” card in the Insight section that reflects current/recent mood (from entries or a dedicated mood API).
- [x] **Mood page** – Create a dedicated page to add/log mood (and optionally view recent moods).
- [x] **Previous mood** – On that page (or in insight), show previous mood entries.
- [x] **Mood trends** – Show mood trends (e.g. over time / by day). Backend may need an endpoint for mood history or aggregates.

---

## 6. Explore – Discover cards modal

- [x] **Discover modal** – On the Explore page, under Discover, tapping a card (Topics, Popular prompts, Writing tip, Guided) should open a modal that shows data/content for that card (e.g. list of topics, list of prompts, tip text, or guided flow), instead of only starting a journal entry.

---

## 7. Backend / API notes (for reference)

- [ ] **Create entry body** – Backend expects `content` (required). Confirm app sends a valid string; adjust if 400 persists.
- [ ] **Mood** – If you add mood logging/trends, you may need: `GET/POST` mood or entry-based mood aggregation endpoints.
- [ ] **Dashboard/insight stats** – Any metric not yet supported by the API will need a new endpoint or client-side derivation from existing APIs.

---

## Summary

| Area             | Items                                       |
| ---------------- | ------------------------------------------- |
| Crashes & errors | Theme crash, Create entry 400               |
| More page        | All buttons working                         |
| Insight section  | All cards from user data                    |
| My dashboard     | All metric values from data                 |
| Mood             | Card, page, previous, trends                |
| Explore Discover | Modal with data for each card               |
| Backend          | Create entry body; optional mood/stats APIs |

Edit this checklist (add/remove/reword) and then ask the assistant to implement the items you want done.
