# MindBloom — Online Phase Implementation Plan

> **Purpose of this document**
> This is the authoritative requirements and design record for MindBloom's online
> phase. It lives in `docs/` inside the project so it survives across AI sessions,
> credit resets, and model changes. If you resume work in a new conversation,
> share this file — it has everything needed to continue without re-typing requirements.
>
> **Last updated:** 2026-06-25
> **Status:** Approved — ready for Phase 1 execution

---

## Background & Current Architecture

MindBloom is a logic & lateral thinking puzzle app for children, built as a
single-page web app deployed on Vercel with Supabase as the database.

### What is working (as of 2026-06-25)
- Child registration and login (bcrypt password, Supabase-backed)
- Puzzle play: multiple-choice, text-input, drawing (canvas)
- Game state persistence: coins, level, completed puzzles, themes, day progression
- Parent dashboard: drawing review queue, day override, calendar view
- User "adhyantha" successfully migrated from local JSON to Supabase

### Current file structure

```
d:\Pet Projects\MindBloomVer01\
 ├── docs/                        ← YOU ARE HERE
 │    ├── implementation_plan.md  ← this file
 │    ├── README.md               ← project overview (moved from root)
 │    └── TASK_LOG.md             ← running task checklist (updated as we work)
 ├── api/
 │    ├── _logger.js              ← server-side request/error logger
 │    ├── _supabase.js            ← shared Supabase client
 │    ├── register.js             ← POST /api/register
 │    ├── login.js                ← POST /api/login  (bcrypt verify)
 │    ├── save-user.js            ← POST /api/save-user
 │    ├── get-user.js             ← GET  /api/get-user
 │    ├── list-users.js           ← GET  /api/list-users
 │    ├── delete-user.js          ← POST /api/delete-user
 │    ├── puzzle-averages.js      ← GET  /api/puzzle-averages
 │    └── log-event.js            ← POST /api/log-event (client error relay)
 ├── logic/
 │    ├── app.js                  ← thin orchestrator (~230 lines, refactored Phase 2)
 │    ├── auth.js                 ← login/register/logout form handling
 │    ├── puzzle.js               ← puzzle deck, arena, answer engine, canvas
 │    ├── gameState.js            ← date-change, day advancement, review queue
 │    ├── parentDash.js           ← parent gate, review queue, stats, calendar
 │    ├── storage.js              ← Auth + game-state manager (online-only, no offline fallback)
 │    └── ui/
 │         ├── header.js          ← header bar, avatar selector, sound/theme
 │         ├── history.js         ← puzzle history tab
 │         └── celebrate.js       ← confetti, level-up modal, ambient emoji
 ├── helpers/
 │    ├── logger.js               ← client-side ring-buffer logger
 │    └── sound.js                ← Web Audio wrapper
 ├── data/
 │    └── puzzles.json            ← current puzzle set (~8-9 yrs)
 ├── tests/
 │    ├── api/                    ← API handler tests
 │    ├── unit/                   ← Unit tests (age, puzzle-band)
 │    └── integration/            ← End-to-end flow tests
 ├── index.html
 ├── styles.css
 ├── schema.sql                   ← Supabase DB schema (keep updated)
 ├── vercel.json
 └── package.json
```

### Supabase DB schema (current)

```sql
CREATE TABLE public.users (
  username        TEXT PRIMARY KEY,
  password_hash   TEXT NOT NULL,
  parent_code     TEXT NOT NULL DEFAULT '0000',
  parent_email    TEXT,
  parent_phone    TEXT,
  profile         JSONB NOT NULL DEFAULT '{}',
  game_state      JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`profile` JSONB contains:
`childFirstName, childLastName, childGender, childAge, childAvatar,
livingCountry, culturalAffiliation, parentEmail, parentPhone`

`game_state` JSONB contains:
`currentDay, unlockedUpToDay, lastActiveDate, coins, level, levelName,
theme, isMuted, completedPuzzles`

---

## Known Issues to Fix

| # | Issue | Fixed in |
|---|-------|----------|
| 1 | `app.js` is a 1964-line monolith | Phase 2 |
| 2 | `childAge` stored as integer; no DOB stored | Phase 3 |
| 3 | Single puzzle set — no age banding | Phase 3 |
| 4 | Canvas drawing base64 stored in `game_state` JSONB (~60-95 KB per drawing) | Phase 4 |
| 5 | No server-side request logging | Phase 1 |
| 6 | No automated test suite | Phase 1 |
| 7 | `schema.sql` is out of date vs live DB | Phase 3 |
| 8 | `server.py` offline mode will diverge from schema — remove it | Phase 2 |
| 9 | `SUPABASE_URL` env var must NOT include `/rest/v1` suffix | Fixed ✅ |

---

## Decisions Log

| Decision | Choice | Notes |
|----------|--------|-------|
| Puzzle content for 4-5 and 6-7 bands | **AI-generated as part of Phase 3** | No existing content; generate age-appropriate puzzles |
| Band progression consent | **Automatic** | Parent approval is a future enhancement |
| Offline mode (server.py) | **Remove in Phase 2** | Will diverge from schema; Supabase is the source of truth |
| Friend invite method | **Username lookup only** | Shareable link/QR code is a future expansion |
| Admin account setup | **Supabase dashboard** | See Phase 6 setup instructions |
| Design docs location | **`docs/` folder in project root** | Survives across AI sessions and model changes |

---

## Phased Delivery Plan

### Delivery Sequence

```
Phase 1: Logging & Tests        ← safe, no user-facing changes
Phase 1.5: Frontend End-to-End Testing (Playwright)
Phase 2: Refactoring + Remove Offline
Phase 3: DOB + Age Bands + New Puzzle Sets (AI-generated content)
Phase 4: Drawing Storage TTL
Phase 5: Friend Invite & Peer Panel
Phase 6: Admin Dashboard
Future:  Landing Login Page
Future:  Social Login (Gmail/Facebook/Apple)
```

---

## Phase 1 — Server-Side Logging & Test Framework

**Risk:** Low | **Effort:** Medium | **Status:** ✅ Done

### 1A. Server-Side Request Logging

New file: `api/_logger.js`

```js
// Thin middleware — used by every handler
function logRequest(req, { status, ms }) {
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    method: req.method,
    path: req.url,
    status,
    ms,
    user: req.body?.username || '—'
  }));
}
function logError(context, err) {
  console.error(JSON.stringify({
    ts: new Date().toISOString(),
    ...context,
    error: err.message,
    stack: err.stack
  }));
}
module.exports = { logRequest, logError };
```

Output target: Vercel's built-in log stream (no extra DB table needed at this scale).

Every API handler wraps its logic with try/catch + `logRequest` + `logError`.

### 1B. Client-Side Logger Enhancement

Extend `helpers/logger.js`:
- Tag each entry with a `sessionId` (UUID generated at page load)
- Add `Logger.info()`, `Logger.warn()`, `Logger.error()` as first-class methods
- On unhandled error: POST a summary to `POST /api/log-event` (fire-and-forget)

New file: `api/log-event.js`
- Accepts `{ sessionId, level, message, context }`
- Writes to Vercel logs via `console.error`/`console.warn`

### 1C. Automated Test Suite

**Tool:** `node --test` (built into Node 18+, zero extra dependencies)

```
tests/
  api/
    register.test.js    — happy path, duplicate username, missing fields
    login.test.js       — correct password, wrong password, unknown user
    save-user.test.js   — merge game_state, partial update
    get-user.test.js    — found, not found
  unit/
    age.test.js         — DOB → age calculation
    puzzle-band.test.js — age → puzzle band selection
  integration/
    flow.test.js        — register → login → save → get round-trip (hits Supabase)
```

`package.json` additions:
```json
"scripts": {
  "test":            "node --test tests/**/*.test.js",
  "test:unit":       "node --test tests/unit/*.test.js",
  "test:api":        "node --test tests/api/*.test.js",
  "test:integration":"node --test tests/integration/*.test.js"
}
```

Integration tests use a `test_users` table (same Supabase project) that is
truncated before each run. Never touch `public.users` from tests.

### Phase 1 — Files to change

| Action | File |
|--------|------|
| NEW | `api/_logger.js` |
| NEW | `api/log-event.js` |
| MODIFY | `api/register.js`, `login.js`, `save-user.js`, `get-user.js`, `list-users.js`, `delete-user.js`, `puzzle-averages.js` — add logger wrapping |
| MODIFY | `helpers/logger.js` — sessionId, explicit API, POST on unhandled error |
| NEW | `tests/api/register.test.js` |
| NEW | `tests/api/login.test.js` |
| NEW | `tests/api/save-user.test.js` |
| NEW | `tests/api/get-user.test.js` |
| NEW | `tests/unit/age.test.js` |
| NEW | `tests/unit/puzzle-band.test.js` |
| NEW | `tests/integration/flow.test.js` |
| MODIFY | `package.json` — add test scripts |

---

## Phase 1.5 — Frontend End-to-End Testing

**Risk:** Low | **Effort:** Medium | **Status:** ⬜ Not started

### 1.5A. Playwright Setup
- Install `@playwright/test`
- Configure `playwright.config.js` to run against `http://localhost:3000` (auto-starting the local dev server using `npx vercel dev`).

### 1.5B. E2E Test Suite Creation
Create `tests/e2e/` with the following test files:

**`tests/e2e/auth.spec.js`**
- Test Registration flow and Login flow.
- Verify the 4-digit PIN requirement for Parent registration.

**`tests/e2e/gameplay.spec.js`**
- Log in and solve a mix of 5 puzzles with some correct and some wrong answers.
- Verify that coins are awarded properly and the Day progression locks correctly.

**`tests/e2e/parentDash.spec.js`**
- Check metrics in the context of right and wrong answers (ensuring wrong answers don't inflate progress bars).
- Verify the calendar updates correctly based on local time.

---

## Phase 2 — Codebase Refactoring + Remove Offline Mode

**Risk:** Medium | **Effort:** High | **Status:** ✅ Done

### 2A. Split app.js monolith

`logic/app.js` (1964 lines) → split into:

```
logic/
  app.js          — thin orchestrator: init(), routing only (~150 lines)
  auth.js         — register/login/logout form handling
  puzzle.js       — puzzle loading, rendering, answer submission, canvas
  gameState.js    — checkDateChange, level-up, coin calc, day advancement
  parentDash.js   — parent gate, review queue, calendar, stats
  friendsPanel.js — friend invite UI (stubbed, used in Phase 5)
  adminDash.js    — admin dashboard (stubbed, used in Phase 6)
  ui/
    header.js     — renderHeader(), avatar selector
    history.js    — renderHistoryTab(), history detail view
    celebrate.js  — confetti, level-up modal, emoji burst
```

Rules:
- Each module exports named functions; `app.js` imports and wires them
- No circular imports
- All DOM selectors owned by the module that uses them
- `StorageService` remains the single data layer — no direct `fetch()` from UI modules
- ESM (`import`/`export`) throughout — matches current pattern

### 2B. Remove offline mode

- Delete `server.py`
- Remove offline fallback code from `logic/storage.js`:
  - `loginUser()`: remove the `localStorage` password-compare fallback
  - `registerUser()`: remove the offline `localStorage` save path
  - Keep `localStorage` as a **read cache only** (populated after successful server response)
- Delete `data/user_adhyantha.json` and `data/user_test.json` (local test files)
- Keep `data/puzzles_*.json` (puzzle content, served as static files)
- Update `.gitignore` to exclude `data/user_*.json`

### Phase 2 — Files to change

| Action | File |
|--------|------|
| MODIFY | `logic/app.js` — reduce to orchestrator |
| NEW | `logic/auth.js` |
| NEW | `logic/puzzle.js` |
| NEW | `logic/gameState.js` |
| NEW | `logic/parentDash.js` |
| NEW | `logic/ui/header.js` |
| NEW | `logic/ui/history.js` |
| NEW | `logic/ui/celebrate.js` |
| MODIFY | `logic/storage.js` — remove offline fallback paths |
| DELETE | `server.py` |
| DELETE | `data/user_adhyantha.json`, `data/user_test.json`, `data/user___test_alex.json` |
| MODIFY | `index.html` — update script src if needed |
| MODIFY | `.gitignore` — add `data/user_*.json` |

---

## Phase 3 — DOB Input & Age-Banded Puzzle Sets

**Risk:** Low-Medium | **Effort:** High | **Status:** ⏳ In Progress

### 3A. Schema changes — `public.users`

```sql
-- Run in Supabase SQL Editor
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS birth_month  SMALLINT,   -- 1–12
  ADD COLUMN IF NOT EXISTS birth_year   SMALLINT,   -- e.g. 2016
  ADD COLUMN IF NOT EXISTS puzzle_band  TEXT NOT NULL DEFAULT '8-9';
  -- values: '4-5' | '6-7' | '8-9'
```

### 3B. Age / band calculation

New shared file: `logic/ageUtils.js`

```js
// Returns age in whole years (floor) from birth month + year
export function calcAge(birthMonth, birthYear) {
  const now = new Date();
  let age = now.getFullYear() - birthYear;
  if (now.getMonth() + 1 < birthMonth) age--; // birthday not yet this year
  return age;
}

// Returns puzzle band string
export function ageToBand(age) {
  if (age <= 5) return '4-5';
  if (age <= 7) return '6-7';
  return '8-9';          // 8+ years
}
```

### 3C. Registration form — replace age field with DOB

Replace:
```html
<input id="child-age" type="number" min="4" max="12">
```
With:
```html
<select id="child-birth-month">
  <option value="1">January</option> ... <option value="12">December</option>
</select>
<select id="child-birth-year">
  <!-- 2014 to 2022 — covers ages 4 to 12 in 2026 -->
  <option value="2022">2022</option> ... <option value="2014">2014</option>
</select>
```

`storage.js registerUser()` changes:
- Accept `birthMonth`, `birthYear` instead of `age`
- Compute `age` locally for display only
- Send `birth_month`, `birth_year`, `puzzle_band` to server

`api/register.js` changes:
- Accept `birth_month`, `birth_year`
- Compute `puzzle_band = ageToBand(calcAge(birth_month, birth_year))`
- Store all three columns

### 3D. Puzzle data — 3 age-banded files

**Existing** `data/puzzles.json` → rename to `data/puzzles_8-9.json`

**New** files to generate with age-appropriate content:
- `data/puzzles_4-5.json` — simpler, visual, concrete puzzles
- `data/puzzles_6-7.json` — moderate complexity

Each puzzle entry format (unchanged except for `band` field documentation):
```json
{
  "id":          "d1_q1",
  "day":         1,
  "number":      1,
  "band":        "8-9",
  "title":       "Colour Me Right",
  "category":    "Visual Reasoning",
  "difficulty":  "Easy",
  "type":        "multiple-choice",
  "coinsReward": 10,
  "question":    "...",
  "options":     ["A", "B", "C", "D"],
  "answer":      "A",
  "explanation": "...",
  "hints":       ["..."]
}
```

`app.js` / `puzzle.js` — load file matching user's band:
```js
const puzzleFile = `data/puzzles_${currentUser.puzzleBand}.json`;
```

### 3E. Band progression (automatic)

When a child completes all days in their current band:
- Show "You've mastered the X-Y age puzzles! Ready for harder ones?" modal
- Auto-advance: `puzzle_band` updated to next tier, `game_state` reset to Day 1
- `POST /api/save-user` with `puzzle_band` in the update payload

Band order: `4-5` → `6-7` → `8-9` → (stays at 8-9, no more bands)

> **Future enhancement:** Parent approval gate before band advancement.

### Phase 3 — Files to change

| Action | File |
|--------|------|
| MODIFY | `schema.sql` — add birth_month, birth_year, puzzle_band |
| NEW | Supabase SQL migration (run manually in dashboard) |
| MODIFY | `api/register.js` — accept DOB, compute & store band |
| MODIFY | `api/save-user.js` — allow updating puzzle_band column |
| MODIFY | `api/login.js` — return birth_month, birth_year, puzzle_band |
| MODIFY | `logic/storage.js` — pass DOB fields, map puzzle_band |
| NEW | `logic/ageUtils.js` — calcAge(), ageToBand() |
| MODIFY | `index.html` — replace age input with month+year selects |
| MODIFY | `logic/puzzle.js` — load correct puzzle file per band |
| NEW | `data/puzzles_4-5.json` — AI-generated age-appropriate puzzles |
| NEW | `data/puzzles_6-7.json` — AI-generated age-appropriate puzzles |
| RENAME | `data/puzzles.json` → `data/puzzles_8-9.json` |
| NEW | `tests/unit/age.test.js` |
| NEW | `tests/unit/puzzle-band.test.js` |

---

## Phase 4 — Canvas Drawing Storage with 7-Day TTL

**Risk:** Low | **Effort:** Medium | **Status:** ✅ Done

### Problem

Drawing answers are base64 PNG data URLs (~30–60 KB each) stored inside
`game_state` JSONB. This inflates every row read.

### Solution: Supabase Storage bucket

**Setup (once, in Supabase dashboard):**
- Create bucket: `drawings`
- Visibility: **Private** (access via signed URLs only)

**New `game_state` drawing entry shape:**
```json
"d1_q3": {
  "userAnswer": "drawings/adhyantha/d1_q3_20260622.png",
  "drawingExpiresAt": "2026-06-29T00:00:00Z",
  "pendingApproval": true
}
```

### New API endpoints

`api/upload-drawing.js` — POST
- Receives `{ username, puzzleId, imageDataUrl }`
- Converts base64 to Buffer, uploads to `drawings/{username}/{puzzleId}_{date}.png`
- Updates `game_state.completedPuzzles[puzzleId].userAnswer` to storage path
- Sets `drawingExpiresAt = now + 7 days`
- Returns `{ success: true, path }`

`api/get-drawing-url.js` — GET
- Receives `?username=&puzzleId=`
- Returns a signed URL valid for 1 hour (for parent review)
- If expired or approved: returns `{ expired: true }`

### Nightly cleanup — pg_cron

```sql
-- Run in Supabase SQL Editor to set up nightly job
SELECT cron.schedule(
  'purge-expired-drawings',
  '0 2 * * *',
  $$
    UPDATE public.users
    SET game_state = jsonb_set(
      game_state,
      '{completedPuzzles}',
      (
        SELECT jsonb_object_agg(
          key,
          CASE
            WHEN value->>'drawingExpiresAt' IS NOT NULL
             AND (value->>'drawingExpiresAt')::timestamptz < now()
             AND (value->>'pendingApproval')::boolean IS NOT TRUE
            THEN value - 'userAnswer' - 'drawingExpiresAt'
            ELSE value
          END
        )
        FROM jsonb_each(game_state->'completedPuzzles')
      )
    )
    WHERE game_state->'completedPuzzles' IS NOT NULL;
  $$
);
```

Storage file deletion: handled by a Vercel cron function (`vercel.json` cron)
that calls `supabase.storage.from('drawings').remove([...expiredPaths])`.

### Parent review flow

1. Parent dashboard calls `GET /api/get-drawing-url?username=X&puzzleId=Y`
2. Receives 1-hour signed URL → renders `<img src="...">` inline
3. Parent clicks Approve → `POST /api/save-user` sets `pendingApproval: false`
4. Nightly cron deletes the file (approved = no longer needed to keep)

### Phase 4 — Files to change

| Action | File |
|--------|------|
| NEW | `api/upload-drawing.js` |
| NEW | `api/get-drawing-url.js` |
| MODIFY | `api/save-user.js` — handle pendingApproval update |
| MODIFY | `logic/puzzle.js` — call upload-drawing on canvas submit |
| MODIFY | `logic/parentDash.js` — call get-drawing-url for review |
| MODIFY | `schema.sql` — document drawing sub-fields in game_state |
| NEW | Supabase SQL — pg_cron nightly cleanup |
| MODIFY | `vercel.json` — Vercel cron job for Storage file deletion |

---

## Phase 5 — Friend Invite & Peer Leaderboard

**Risk:** Medium | **Effort:** Medium | **Status:** ⬜ Not started

### Schema

```sql
CREATE TABLE IF NOT EXISTS public.friendships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user   TEXT NOT NULL REFERENCES public.users(username),
  to_user     TEXT NOT NULL REFERENCES public.users(username),
  status      TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'accepted' | 'rejected'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_user, to_user)
);
```

### New API endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/friend-invite` | POST | Send invite `{ from, to }` |
| `/api/friend-respond` | POST | Accept/reject `{ from, to, action }` |
| `/api/friend-list` | GET | `?username=X` — accepted friends with avatar, coins, currentDay |

### Visible peer data (accepted friends only)

```json
{
  "username": "xyz",
  "childAvatar": "🐱 Doraemon",
  "coins": 95,
  "currentDay": 3,
  "puzzleBand": "8-9"
}
```

No name, email, phone, or parent data is ever shared between friends.

### Invite method

**Username lookup only** — child enters their friend's username.

> **Future expansion:** Shareable link / QR code invite.

### UI

- New "Friends" tab (👫) in main app navigation
- Friend list: avatar + coins + day progress bar
- "Invite a friend" button → enter username → sends invite
- Pending invite notification shown on login

### Phase 5 — Files to change

| Action | File |
|--------|------|
| NEW | Supabase SQL — `public.friendships` table |
| NEW | `api/friend-invite.js` |
| NEW | `api/friend-respond.js` |
| NEW | `api/friend-list.js` |
| NEW | `logic/friendsPanel.js` |
| MODIFY | `index.html` — add Friends tab |
| MODIFY | `logic/app.js` — wire Friends tab |

---

## Phase 6 — Admin Dashboard

**Risk:** Low | **Effort:** Medium | **Status:** ⬜ Not started

### Admin account setup

The admin account uses the sentinel username `__admin__` in `public.users`.

**To set up (one-time, in Supabase SQL Editor):**

```sql
INSERT INTO public.users (
  username,
  password_hash,
  parent_code
)
VALUES (
  '__admin__',
  -- Generate bcrypt hash (12 rounds) of your chosen password at:
  -- https://bcrypt-generator.com  (set rounds to 12)
  '$2a$12$YOUR_HASH_HERE',
  '0000'
)
ON CONFLICT (username) DO NOTHING;
```

Choose a strong password (16+ characters, mix of letters, numbers, symbols).
Store it in your password manager — it cannot be recovered.

### Admin detection

`api/login.js` — if `username === '__admin__'`, add `isAdmin: true` to response.
`app.js` — if `currentUser.isAdmin`, route to admin dashboard (skip child UI entirely).

### Admin dashboard data

`api/admin-users.js` — GET (server validates `username === '__admin__'` before serving)

Returns per-user:
```json
{
  "username":         "adhyantha",
  "childFirstName":   "Adhyantha Sniddhe",
  "childAge":         9,
  "puzzleBand":       "8-9",
  "parentEmail":      "...",
  "parentPhone":      "...",
  "coins":            130,
  "currentDay":       2,
  "puzzlesAttempted": 10,
  "lastLogin":        "2026-06-23T20:43:14Z"
}
```

`puzzlesAttempted` = count of keys in `game_state->'completedPuzzles'` (SQL: `jsonb_object_keys`)
`lastLogin` = `updated_at` column

### Admin UI

- Sortable table: child name, age, band, coins, day, puzzles attempted, last login
- Filter by puzzle band
- Click row → read-only profile view
- Export as CSV button

### Phase 6 — Files to change

| Action | File |
|--------|------|
| NEW | `api/admin-users.js` |
| NEW | `logic/adminDash.js` |
| MODIFY | `index.html` — admin section (hidden for non-admins) |
| MODIFY | `logic/app.js` — admin routing |
| MODIFY | `api/login.js` — add `isAdmin` flag |

---

## Future Expansion — Landing Login Page

**Risk:** Low | **Effort:** Medium | **Status:** ⬜ Not started

### Requirements
Create a landing login page with additional details about the app:
- State clearly: "5 puzzles a day - not to overload the kids"
- Disclaimer: "This is not a substitute for curriculum"
- Intended audience: "Meant for curious minds"
- Validation: "Validated to be age-appropriate"
- Legal & curation: "Puzzles not curated or approved by any agency or board or authority"
- Legal: "No legal challenge by parents on the app or the company owning and developing the app"

---

## Future: Social Login (Gmail / Facebook / Apple)

> **Status:** Advisory only — not in active scope. Evaluate after Phase 3 is stable.

### Recommended approach: Supabase Auth

Supabase has native OAuth support for Google, Facebook, and Apple.

**How it works:**
1. User clicks "Sign in with Google" → Supabase redirects to Google OAuth
2. Supabase creates a row in `auth.users` (UUID-keyed, managed by Supabase)
3. Your `public.users` table gets a new `auth_id UUID` column linking the two
4. Supabase issues a JWT — frontend passes it on all API calls
5. Vercel functions verify with `supabase.auth.getUser(token)`

**Pros:** Minimal code. Google/Facebook/Apple all first-class Supabase providers.
Handles PKCE, token refresh, session management.

**Cons:**
- Existing users (bcrypt passwords) need migration or re-registration
- `username` as PK would become secondary key (auth_id UUID becomes PK)
- Apple OAuth requires an Apple Developer account

**Start with Google only** (most parents have Gmail). Facebook and Apple are
toggle switches once the OAuth infrastructure exists.

**Pre-requisite:** Phase 2 (refactoring) must be complete before wiring OAuth
through the codebase cleanly.

---

## Appendix: Environment Variables

| Variable | Where | Notes |
|----------|-------|-------|
| `SUPABASE_URL` | Vercel env + `.env.local` | **Must be bare URL** — no `/rest/v1` suffix. E.g. `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Vercel env + `.env.local` | Service role key — never expose in frontend |

`.env.local` template (create from `.env.example`):
```
SUPABASE_URL=https://upmjymnuntmznlqumgvt.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
```
