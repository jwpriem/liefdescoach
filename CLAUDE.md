# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
yarn dev        # Dev server on localhost:3000, always on the Neon `dev` branch (never production)
yarn dev --new-database  # First rebuild seed + dev from a fresh anonymised copy of production (dev data is lost), then start
yarn build      # Production build (outputs to .output/)
yarn preview    # Preview production build locally
```

`yarn dev`, `yarn preview`, `yarn db:push` and `yarn db:studio` run through `scripts/with-dev-db.ts`, which fetches the `dev` branch's connection string from the Neon API (`NEON_API_KEY`, `NEON_PROJECT_ID` in `.env`). Local `.env` has no `NUXT_DATABASE_URL`; production (DigitalOcean App Platform) sets its own.

No linter is configured. Node 20 is required.

## Do
1. Follow the DRY (Don't Repeat Yourself) pattern while creating new functionality. When a piece of code is copied or has a similarity of 90%, make it a generic reusable component
2. Request clarity when a ambigious request is made. Never just start developing without context
3. When a new functionality is introduced, first plan and present the solution to verify the outcome
4. When a database migration is needed, always perform a dryrun and present the evidence before proceding

## Don't
1. Copy and reuse a piece of code
2. Redo or adjust database migrations that already ran
3. Delete code without running tests

### E2E Tests (Playwright)

```bash
yarn test:e2e:branch                              # recommended: fresh Neon branch of the anonymised seed, deleted afterwards
yarn test:e2e:branch e2e/booking.spec.ts --headed # one spec, visible browser
yarn test:e2e:branch --keep                       # keep the branch to debug (yarn -s db:branch-url <name> | pbcopy)
BASE_URL=http://localhost:3000 yarn test:e2e      # run against an already-running server (uses TEST_EMAIL/TEST_PASSWORD or the seeded e2e user)
```

Tests are in `e2e/`. Test users and lessons are seeded on every e2e branch from `e2e/fixtures.ts` (`scripts/lib/seed-e2e.ts`). Requires `NEON_API_KEY` and `NEON_PROJECT_ID` in `.env` and Playwright browsers (`yarn playwright install chromium`).

### Database Scripts

Standalone `tsx` scripts in `scripts/` for database management.

```bash
yarn db:seed-lessons     # Seed 12 weeks of Sunday 09:45 hatha yoga + 3 guest lessons
```

`db:seed-lessons` accepts `--weeks N` to customize. Legacy Appwrite migration scripts remain in `scripts/` but are no longer functional.

Neon branches (project `orange-shape-96414119`): `production` (live — never point local `.env` at it), `seed` (anonymised copy of production), `dev` (local development, child of seed), `e2e-*` (throwaway, one per test run).

```bash
yarn db:refresh-seed --yes          # rebuild seed from production (anonymised) + fresh dev; deletes old seed/dev/e2e-*
yarn -s db:branch-url dev | pbcopy  # connection string for a test branch (never printed, never production)
```

When a table or a `students` column is added to `server/database/schema.ts`, classify it in `scripts/lib/anonymise.ts` — the unit tests fail until you do.

## Architecture

This is a **Nuxt 4** application for "Yoga Ravennah" — a yoga studio booking system with a credit-based lesson reservation flow. The UI language is Dutch.

### Database

The app uses **Neon PostgreSQL** via Drizzle ORM. Tables: `students`, `sessions`, `lessons`, `bookings`, `credits`, `health`, `pushSubscriptions`, `otpCodes`.

### Server Auth (`server/utils/auth.ts`)

Two auto-imported helpers for API route protection:

- `requireAuth(event)` — verifies the session cookie, returns the authenticated user or throws 401
- `requireAdmin(event)` — calls `requireAuth`, then checks for the `admin` label or throws 403

### Booking Flow (Server-Side)

Booking and cancellation are handled atomically in server API routes:

- `server/api/handleBooking.post.ts` — validates credits, checks lesson capacity (`MAX_LESSON_CAPACITY` from `server/utils/constants.ts`), prevents duplicates, creates booking, deducts credit
- `server/api/cancelBooking.post.ts` — verifies ownership, enforces 24h cancellation window, deletes booking, refunds credit

The UI delegates to these endpoints via `$fetch`.

### Email

Uses **nodemailer** (SMTP) for all transactional emails. Dev uses Mailtrap sandbox, production uses PrivateEmail. Templates in `server/utils/emailTemplates.ts`.

### State Management (`stores/index.ts`)

Single Pinia store (`main`) handles all app state. Key patterns:

- `fetchWrapper()` — wraps all async actions with loading state, error handling, and Dutch-language error messages
- `getOnBehalfOrUser()` — returns either the `onBehalfOf` user (admin booking for another user) or the logged-in user
- `isAdmin` getter — checks for `admin` label on user

### Plugin (`plugins/rav.ts`)

Provides `$rav` globally with utility functions: Dutch date formatting, calendar link generation (Apple/Google/Outlook), lesson availability checks, phone number formatting. Accessible via `useNuxtApp().$rav`.

### Key UI Pages

- `/lessen` — lesson listing with booking buttons
- `/account` — tabbed view with `AccountBookings`, `AccountDetails`, `AccountLessons` (admin), `AccountUsers` (admin)
- `/archief` — past lessons (admin only)

### Runtime Config

**Private** (server only): `databaseUrl`, `sessionSecret`, `cronSecret`, `mailPass`, `mailPassDev`, `mailUserDev`
**Public**: `vapidPublicKey`

Set via environment variables prefixed with `NUXT_` (e.g., `NUXT_DATABASE_URL`, `NUXT_SESSION_SECRET`).

Locally, `NUXT_DATABASE_URL` is injected by `scripts/with-dev-db.ts` (Neon `dev` branch) or by `yarn test:e2e:branch` (a throwaway `e2e-*` branch) — never put it in `.env`.

### UI Framework

Uses `@nuxt/ui` v4 (based on Tailwind CSS + Reka UI). Primary color is `emerald`. Notifications positioned at top.
