# Lumina Mobile: AI Features Implementation Checklist

Use this checklist to implement **Entry AI**, **Go deeper**, **Journal-context chat**, and **Weekly tips**. Base URL and auth match the rest of the app (e.g. `EXPO_PUBLIC_API_URL`, Clerk Bearer token).

---

## 1. Auth & base

- [ ] Confirm all AI requests use the same base URL as existing API (`getApiBaseUrl()` / `EXPO_PUBLIC_API_URL`)
- [ ] Confirm all requests send `Authorization: Bearer <token>` (or current auth)
- [ ] Confirm POST/PATCH bodies use `Content-Type: application/json`

---

## 2. TypeScript types

Add types (e.g. in `lib/api.ts` or `types/ai.ts`):

- [ ] `EntrySummary` (id, text, model, qualityScore?, createdAt)
- [ ] `EntryMood` (id, label, score?, createdAt)
- [ ] `EntryTag` (id, tag, source: "AI" | "USER")
- [ ] `EntryWithAi` (entry + summary, mood, tags) or extend existing `JournalEntry`
- [ ] `GoDeeperResponse` (data.questions: string[])
- [ ] `ChatSendRequest` (message, sessionId?)
- [ ] `ChatSendResponse` (data.reply, data.sessionId)
- [ ] `WeeklyTipType`: "missed_journal" | "quality_down" | "streak" | "consistency" | "general"
- [ ] `WeeklyTip` (id, title, shortDescription, detailedText, tipType, readAt, createdAt)
- [ ] `WeeklyTipListResponse` and `WeeklyTipGenerateResponse`

---

## 3. Entry AI (regenerate-ai)

**Endpoint:** `POST /api/entries/{entryId}/regenerate-ai` (no body). Response: full entry with summary, mood, tags, qualityScore.

- [ ] Add `regenerateEntryAi(getToken, entryId)` in `lib/api.ts` (reuse existing `request`, map response to app entry shape)
- [ ] Expose in `useApi()` as e.g. `regenerateEntryAi(entryId)`
- [ ] **Entry screen:** Add “Generate AI” / “Refresh AI” button (or auto-call once after open)
- [ ] Show loading state while request in flight; disable button when loading
- [ ] On 200: update local entry state (or refetch entry); show summary, mood pill(s), tags, optional “Reflection score: X/100”
- [ ] On 502: show “AI is temporarily unavailable” + Retry; on 404 show “Entry not found”
- [ ] Optional: call regenerate-ai automatically once after creating/opening entry

---

## 4. Go deeper (during writing)

**Endpoint:** `POST /api/entries/{entryId}/go-deeper`  
**Body (optional):** `{ "currentContent": "string" }`. Response: `{ data: { questions: string[] } }`.

- [ ] Add `goDeeper(getToken, entryId, currentContent?)` in `lib/api.ts`
- [ ] Expose in `useApi()` as e.g. `goDeeper(entryId, currentContent?)`
- [ ] **Entry screen (composer):** Add “Go deeper” / “Reflect more” / “Get prompts” button
- [ ] Button enabled only when entry exists (saved); for new entry, either disable until first save or create draft first then call with `currentContent`
- [ ] On tap: POST with current draft text if user is editing; show loading
- [ ] On 200: show questions in list or bottom sheet; user can tap to insert or use as prompt
- [ ] On 502: show retry; on 404 show “Entry not found”
- [ ] Handle empty `questions` array (e.g. “No questions right now”)

---

## 5. Journal-context chat

**Endpoint:** `POST /api/journals/{journalId}/chat`  
**Body:** `{ "message": "string", "sessionId"?: number }`. Response: `{ data: { reply: string; sessionId: number } }`.

- [ ] Add `sendJournalChat(getToken, journalId, message, sessionId?)` in `lib/api.ts`
- [ ] Expose in `useApi()` as e.g. `sendJournalChat(journalId, message, sessionId?)`
- [ ] **Chat / Reflect screen:** Journal picker first (reuse `fetchJournals()`)
- [ ] After journal selected: chat UI with input and message list
- [ ] State: hold `sessionId` in component state (or in-memory per journal); omit for first message, send for follow-ups
- [ ] On send: POST with `message` and current `sessionId`; show loading on send
- [ ] On 200: append assistant reply to UI; save `data.sessionId` for next message
- [ ] On 502: show “AI temporarily unavailable” + Retry; on 404 “Journal not found”
- [ ] Optional: if reply suggests goal/topic update, show “Update goal to ‘…’?” and on confirm call **PATCH** `/api/users/me/preferences` (goal/topics)

---

## 6. Weekly tips

**Endpoints:**

- `GET /api/users/me/weekly-tips?limit=10` → list of tips
- `POST /api/users/me/weekly-tips/generate` → create one tip (201)
- `PATCH /api/users/me/weekly-tips/{tipId}/read` → mark read (204)

- [ ] Add `fetchWeeklyTips(getToken, limit?)` in `lib/api.ts`
- [ ] Add `generateWeeklyTip(getToken)` in `lib/api.ts`
- [ ] Add `markWeeklyTipRead(getToken, tipId)` in `lib/api.ts`
- [ ] Expose all three in `useApi()`
- [ ] **Home / Dashboard:** One “Weekly tip” card
  - [ ] On load: GET `weekly-tips?limit=1`; show first tip’s `title` + `shortDescription`, or “Get your weekly tip” CTA if empty
  - [ ] “Get weekly tip” → POST generate → show returned tip (modal or detail); optionally PATCH read on dismiss
- [ ] **Tips list (optional):** “See all tips” → GET with limit → list cards; tap → detail
- [ ] **Detail:** Render `detailedText` as markdown; on open call PATCH `.../read` and update local `readAt` (unread badge)
- [ ] Use `tipType` for icon/color (e.g. streak = flame, missed_journal = calendar, quality_down = pen)
- [ ] On 502 for generate: “Failed to generate tip” + Retry; on 404 for read: ignore or refresh list

---

## 7. Error handling (global)

- [ ] 401: same as rest of app (e.g. redirect to sign-in or refresh token)
- [ ] 404: show “Not found” and navigate back or refresh where appropriate
- [ ] 502: show short user message (“AI is temporarily unavailable”) + Retry; do not expose raw error strings
- [ ] Network errors: same as rest of app (“Check your connection” + retry)
- [ ] All POST requests: show loading state and disable submit/buttons while loading to avoid double-send

---

## 8. Quick reference: endpoints

| Method | Path                                  | Body                          | Use                                |
| ------ | ------------------------------------- | ----------------------------- | ---------------------------------- |
| POST   | `/api/entries/{id}/regenerate-ai`     | —                             | Summary, mood, tags, quality score |
| POST   | `/api/entries/{id}/go-deeper`         | `{ currentContent?: string }` | 2–4 reflection questions           |
| POST   | `/api/journals/{id}/chat`             | `{ message, sessionId? }`     | Chat reply + sessionId             |
| GET    | `/api/users/me/weekly-tips?limit=10`  | —                             | List recent tips                   |
| POST   | `/api/users/me/weekly-tips/generate`  | —                             | Generate one tip                   |
| PATCH  | `/api/users/me/weekly-tips/{id}/read` | —                             | Mark tip as read                   |

---

## 9. Lumina level and entry creation

**GET /api/users/me/stats** returns `luminaScore`, `luminaLevel`. Use for level/progress UI.

- [ ] **What increases score:** entry creation, streaks, consistency, high quality score (from Regenerate AI), prompt completion (Go deeper). Show “Journal more days and use Go deeper to level up” in UI.
- [ ] **What decreases score:** missed scheduled journal days when daily reminder is on. Encourage reminder + journaling.
- [ ] In UI: show level (1–5), score, streak, consistency; optional short line linking Regenerate AI and Go deeper to leveling.

---

## 10. Loading states and transitions

- [ ] **Entry AI:** Skeleton or staged reveal for summary/mood/tags/quality (e.g. opacity fade-in, not just spinner); disable “Generate AI” with subtle loading state (e.g. “Analyzing…”).
- [ ] **Go deeper:** Loading state on button (“Getting prompts…”); smooth open/close for questions list or bottom sheet (e.g. FadeInDown or slide).
- [ ] **Chat:** Loading indicator while assistant reply is being fetched (e.g. typing dots or skeleton bubble); smooth append of new messages.
- [ ] **Weekly tip:** Card skeleton on load; “Generate” shows progress (“Generating your tip…”); smooth transition when tip appears (fade or slide).

---

## 11. UX summary

- [ ] Entry screen: Generate/Refresh AI + Go deeper button; show summary, mood, tags, quality score with nice loading and transitions
- [ ] Chat: journal picker → chat UI; persist sessionId per journal for thread; smooth message append
- [ ] Weekly tip: one card on home; generate CTA; optional list + detail with markdown; mark read on open; smooth transitions
