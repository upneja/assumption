# pregame.lol – Assumptions & Guess the Imposter

Mobile-first party games for in-person play. One person hosts, everyone else joins on their phone with a short code, and the game state stays in sync through Supabase realtime. Two games ship together:

- **Assumptions:** Players answer as if they were someone else in the room while everyone tries to guess their secret assignment.
- **Guess the Imposter:** Classic social deduction. One player is clueless about the prompt; the room has to smoke them out.

## Quick start
- Prereqs: Node 18+, npm, and a Supabase project.
- Install deps: `cd web && npm install`.
- Create `web/.env.local`:
  ```
  SUPABASE_URL=your-supabase-url
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  ```
- Set up the database: run the SQL in `web/supabase/schema.sql` in the Supabase SQL editor (enables realtime + basic policies).
- Run the app: `npm run dev` from `web`, then open http://localhost:3000.

## Repo layout
- `web/` – Next.js 16 App Router app, Tailwind 4, Vitest + Testing Library, Playwright config.
- `web/src/app/` – Pages, API routes, and game flows (`/`, `/room/[code]`, `/imposter/room/[code]`, `/how-to-play`).
- `web/src/lib/` – Game engine logic, Supabase clients (service + anon), realtime subscriptions, and game services.
- `web/src/components/` – UI for each game phase (lobby, wheel, hotseat, voting, reveal, scoreboard).
- `web/supabase/schema.sql` – Database schema for rooms, players, assignments, imposter clues/votes, and realtime setup.
- `docs/` – Product notes/PRD (`prd.md`), planning docs, and the imposter game brief.

## Game flows
- **Assumptions:** lobby → assignments → intro → wheel spin picks hot seat → hot seat answers as their assigned person → everyone votes → reveal → scoreboard → repeat until everyone has been hot seat, then final reveal.
- **Guess the Imposter:** lobby → host picks topic → secret word goes to civilians (imposter gets nothing) → clue rounds → discussion → vote → reveal/elimination → repeat until imposters are caught or they reach parity.

## Architecture notes
- **Stack:** Next.js App Router + React 19, Tailwind 4, Supabase for storage and realtime broadcasts, TypeScript everywhere.
- **State sync:** Server API routes mutate Supabase via the service role client, then broadcast room/player updates over Supabase realtime channels; clients subscribe through `web/src/lib/realtime.ts`.
- **Identity:** Lightweight `sessionId` persisted in `localStorage` (`web/src/lib/session.ts`) is used to re-associate players across refreshes.
- **Data model:** Tables for rooms, players, assignments, imposter clues, and imposter votes; indexes + triggers are defined in `web/supabase/schema.sql`.

## Running checks
- Lint: `npm run lint`
- Unit tests: `npm run test`
- Coverage: `npm run test:coverage`
- Playwright (when configured): `npx playwright test` (uses `PLAYWRIGHT_BASE_URL`, defaults to `http://localhost:3000`)

## Key API routes
- Assumptions: `POST /api/rooms` (create), `POST /api/rooms/[code]/join`, `/start`, `/spin`, `/vote`, `/next`.
- Guess the Imposter: `POST /api/imposter/rooms`, `POST /api/imposter/rooms/[code]/join`, `/start`, `/advance`, `/clue`, `/vote`.
- All routes validate session + host permissions where needed and broadcast updates to connected clients.

## Development tips
- The UI is mobile-first; use your browser’s device toolbar to validate flows.
- Keep service-role keys server-only (`.env.local`) and never expose them beyond API routes.
- For local debugging without Supabase, mock responses in the UI layers or run against a disposable Supabase project.

## Further reading
- Product requirements and future scope: `docs/prd.md`
- Imposter game details: `docs/IMPOSTER_GAME.md`
- Project planning notes: `docs/project_plan.md`
