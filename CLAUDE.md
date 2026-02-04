# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
npm run dev        # Dev server on localhost:3000
npm run build      # Production build (outputs to .output/)
npm run preview    # Preview production build locally
```

No linter is configured. Node 20 is required.

### E2E Tests (Playwright)

```bash
# Requires dev server running (npm run dev) and Playwright browsers installed (npx playwright install chromium)
TEST_EMAIL=user@example.com TEST_PASSWORD=secret npm run test:e2e          # headless
TEST_EMAIL=user@example.com TEST_PASSWORD=secret npm run test:e2e:headed   # visible browser
BASE_URL=http://localhost:3000 npm run test:e2e                            # custom base URL
```

Tests are in `e2e/`. The test user must exist in Appwrite Auth and have at least 1 credit for the booking test to pass.

### Database Scripts

Standalone `tsx` scripts in `scripts/` for Appwrite database management. Require env vars `NUXT_PUBLIC_PROJECT` and `NUXT_APPWRITE_KEY` (loaded from `.env` via dotenv).

```bash
npm run db:setup            # Create new database with lessons/bookings/students schema
npm run db:seed-lessons     # Seed 12 weeks of Sunday 09:45 hatha yoga + 3 guest lessons
npm run db:sync-students    # Sync Auth users into students collection
```

`db:setup` prints the new database ID to set as `NUXT_PUBLIC_DATABASE`. `db:seed-lessons` accepts `--weeks N` to customize. All scripts share `scripts/appwrite-client.ts` for client setup.

## Architecture

This is a **Nuxt 3** application for "Yoga Ravennah" — a yoga studio booking system with a credit-based lesson reservation flow. The UI language is Dutch.

### Appwrite — Dual Client Pattern

The app uses Appwrite Cloud as its database and auth provider with two separate SDKs:

- **Client-side** (`appwrite` package): `composables/useAppwrite.ts` returns `account`, `databases`, `tablesDB`, and `ID`. Used in the Pinia store for auth operations (login, register, session management).
- **Server-side** (`node-appwrite` package): `server/utils/appwrite.ts` exports `useServerAppwrite()` — a singleton that returns `tablesDB`, `users`, `Query`, and `ID` authenticated with the server API key. Auto-imported by Nitro in all `server/` files.

Appwrite tables: `lessons`, `bookings`, `students`. Bookings reference both a lesson and a student.

### Server Auth (`server/utils/auth.ts`)

Two auto-imported helpers for API route protection:

- `requireAuth(event)` — verifies the Appwrite session cookie, returns the authenticated user or throws 401
- `requireAdmin(event)` — calls `requireAuth`, then checks for the `admin` label or throws 403

### Booking Flow (Server-Side)

Booking and cancellation are handled atomically in server API routes:

- `server/api/handleBooking.post.ts` — validates credits, checks lesson capacity (`MAX_LESSON_CAPACITY` from `server/utils/constants.ts`), prevents duplicates, creates booking, deducts credit
- `server/api/cancelBooking.post.ts` — verifies ownership, enforces 24h cancellation window, deletes booking, refunds credit

The Pinia store (`stores/index.ts`) delegates to these endpoints via `$fetch` and then triggers email sending client-side.

### Email

Two email systems are used:

- **Postmark** (production transactional emails): `server/api/sendBookingConfirmation.post.ts` and `SendBookingCancellation.post.ts` use Postmark templates
- **nuxt-mail** (SMTP): used for simple notifications (new user registration). Dev uses Mailtrap sandbox.

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

**Private** (server only): `postmark`, `appwriteKey`
**Public**: `project` (Appwrite project ID), `database` (Appwrite database ID), `mailPass`, `mailPassDev`

Set via environment variables prefixed with `NUXT_` (e.g., `NUXT_APPWRITE_KEY`, `NUXT_PUBLIC_PROJECT`).

### UI Framework

Uses `@nuxt/ui` v2 (based on Tailwind CSS + Headless UI) with `ui: { global: true }`. Primary color is `emerald`. Notifications positioned at top.
