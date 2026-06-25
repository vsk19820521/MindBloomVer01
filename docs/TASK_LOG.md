# MindBloom — Task Log

> Running checklist updated as work progresses.
> Legend: `[ ]` todo · `[/]` in progress · `[x]` done

---

## Pre-Phase: Infrastructure Fixes (Done ✅)

- [x] Fix `SUPABASE_URL` env var (was `/rest/v1/rest/v1/users` double-path bug)
- [x] Run `schema.sql` in Supabase to create `public.users` table
- [x] Migrate user "adhyantha" from local JSON to Supabase
- [x] Delete one-off `migrate_adhyantha.sql` from codebase
- [x] Create `docs/` folder as permanent home for design docs

---

## Phase 1 — Server-Side Logging & Test Framework

- [ ] Create `api/_logger.js` (logRequest, logError)
- [ ] Create `api/log-event.js` (client error POST endpoint)
- [ ] Wrap `api/register.js` with logger
- [ ] Wrap `api/login.js` with logger
- [ ] Wrap `api/save-user.js` with logger
- [ ] Wrap `api/get-user.js` with logger
- [ ] Wrap `api/list-users.js` with logger
- [ ] Wrap `api/delete-user.js` with logger
- [ ] Wrap `api/puzzle-averages.js` with logger
- [ ] Enhance `helpers/logger.js` (sessionId, explicit API, POST on unhandled error)
- [ ] Create `tests/` folder structure
- [ ] Write `tests/api/register.test.js`
- [ ] Write `tests/api/login.test.js`
- [ ] Write `tests/api/save-user.test.js`
- [ ] Write `tests/api/get-user.test.js`
- [ ] Write `tests/unit/age.test.js`
- [ ] Write `tests/unit/puzzle-band.test.js`
- [ ] Write `tests/integration/flow.test.js`
- [ ] Update `package.json` with test scripts
- [ ] Run full test suite — all pass

---

## Phase 2 — Refactoring + Remove Offline Mode

- [ ] Create `logic/auth.js`
- [ ] Create `logic/puzzle.js`
- [ ] Create `logic/gameState.js`
- [ ] Create `logic/parentDash.js`
- [ ] Create `logic/ui/header.js`
- [ ] Create `logic/ui/history.js`
- [ ] Create `logic/ui/celebrate.js`
- [ ] Reduce `logic/app.js` to orchestrator (~150 lines)
- [ ] Remove offline fallback from `logic/storage.js`
- [ ] Delete `server.py`
- [ ] Delete `data/user_adhyantha.json`, `data/user_test.json`, `data/user___test_alex.json`
- [ ] Update `.gitignore` — add `data/user_*.json`
- [ ] Verify app works end-to-end (login, play puzzle, save state)
- [ ] Run test suite — all pass

---

## Phase 3 — DOB Input & Age-Banded Puzzle Sets

- [ ] Run `ALTER TABLE` migration in Supabase (birth_month, birth_year, puzzle_band)
- [ ] Update `schema.sql` to reflect new columns
- [ ] Create `logic/ageUtils.js` (calcAge, ageToBand)
- [ ] Update `api/register.js` — accept DOB, compute band
- [ ] Update `api/login.js` — return birth_month, birth_year, puzzle_band
- [ ] Update `api/save-user.js` — allow updating puzzle_band
- [ ] Update `logic/storage.js` — pass DOB, map puzzle_band
- [ ] Update `index.html` — replace age field with month+year selects
- [ ] Update `logic/puzzle.js` — load correct puzzle file per band
- [ ] Rename `data/puzzles.json` → `data/puzzles_8-9.json`
- [ ] Generate and write `data/puzzles_4-5.json` (age-appropriate content, min 10 days × 5 puzzles)
- [ ] Generate and write `data/puzzles_6-7.json` (age-appropriate content, min 10 days × 5 puzzles)
- [ ] Implement band progression modal + auto-advance logic
- [ ] Update adhyantha's Supabase row with birth_month=8, birth_year=2017, puzzle_band='8-9'
- [ ] Run test suite — all pass

---

## Phase 4 — Canvas Drawing Storage with 7-Day TTL

- [ ] Create `drawings` bucket in Supabase Storage (private)
- [ ] Create `api/upload-drawing.js`
- [ ] Create `api/get-drawing-url.js`
- [ ] Update `api/save-user.js` — handle pendingApproval
- [ ] Update `logic/puzzle.js` — call upload-drawing on canvas submit (replace base64 in gameState)
- [ ] Update `logic/parentDash.js` — use get-drawing-url for review
- [ ] Set up pg_cron nightly cleanup job in Supabase
- [ ] Add Vercel cron to delete expired Storage files
- [ ] Update `schema.sql` — document drawing sub-fields
- [ ] End-to-end test: draw → upload → parent views → approve → nightly purge

---

## Phase 5 — Friend Invite & Peer Panel

- [ ] Run `CREATE TABLE public.friendships` in Supabase
- [ ] Create `api/friend-invite.js`
- [ ] Create `api/friend-respond.js`
- [ ] Create `api/friend-list.js`
- [ ] Create `logic/friendsPanel.js`
- [ ] Add Friends tab to `index.html`
- [ ] Wire Friends tab in `logic/app.js`
- [ ] Add pending invite notification on login
- [ ] End-to-end test: send invite → accept → see peer panel

---

## Phase 6 — Admin Dashboard

- [ ] Insert `__admin__` user in Supabase (manual, see docs/implementation_plan.md Phase 6)
- [ ] Create `api/admin-users.js`
- [ ] Create `logic/adminDash.js`
- [ ] Add admin section to `index.html` (hidden for non-admins)
- [ ] Update `api/login.js` — add isAdmin flag
- [ ] Wire admin routing in `logic/app.js`
- [ ] Implement sortable table, filter by band, CSV export
- [ ] Verify admin cannot see or modify child puzzle state

---

## Future (Not Scheduled)

- [ ] Social login — Google OAuth via Supabase Auth
- [ ] Social login — Facebook (after Google is stable)
- [ ] Social login — Apple (requires Apple Developer account)
- [ ] Parent approval gate for band progression
- [ ] Friend invite via shareable link / QR code
- [ ] Enable Supabase RLS (Row Level Security) with JWT auth
