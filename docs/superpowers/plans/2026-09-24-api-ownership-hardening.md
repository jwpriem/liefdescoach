# API Ownership Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make it structurally hard for one student to read or change another student's data through the API, and close the two gaps found in the audit: the public lessons feed leaks student IDs, and the booking emails trust a client-supplied name.

**Architecture:** A single `requireSelfOrAdmin(event, requestedId)` helper in `server/utils/auth.ts` becomes the only way a route decides whose data it operates on. It replaces six hand-written checks. The public `/api/lessons` payload drops booking/student IDs. Booking confirmation/cancellation emails move from two client-triggered endpoints into a server util that `handleBooking` / `cancelBooking` call themselves, so names and addresses always come from the database. A table-driven IDOR regression suite and a route-guard inventory test keep it that way.

**Tech Stack:** Nuxt 4 / Nitro (auto-imported server utils), h3, Drizzle ORM on Neon Postgres, Vitest (`yarn test:unit`), nodemailer.

**Spec:** No separate spec doc. This plan implements the API audit from the 2026-09-24 session (items 1, 2 and 4 plus regression tests). Summary of the findings:
- All ID-taking routes already check ownership, using four different hand-written patterns.
- `GET /api/lessons` needs no login and returns every booking's `$id` and `studentId`.
- `POST /api/sendBookingConfirmation` / `sendBookingCancellation` take `name` from the request body and don't check that a booking exists. Any logged-in user can trigger admin emails/pushes with any name.

## Global Constraints

- Node 20. Run unit tests with `yarn test:unit`. Baseline before starting: **14 files, 64 tests passing**.
- UI and error messages are Dutch. Use `'Geen toegang'` (403) and `'Niet ingelogd'` (401) exactly as the existing code does.
- DRY (CLAUDE.md): no copy-pasted logic. Shared test scaffolding lives in `server/test-utils/index.ts`.
- Don't delete code without running tests (CLAUDE.md): every deletion step is followed by a `yarn test:unit` run.
- **No database migrations.** No schema changes in this plan.
- Server utils in `server/utils/*.ts` are Nitro auto-imports. In Vitest they must be provided with `vi.stubGlobal` (see `server/test-setup.ts`).
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **The current client sends `onBehalfOfUserId: null`** for normal bookings (`app/composables/useBookingActions.ts:16`). It must be treated as "self", not as a 400 or 403. Pinned in Task 1 (helper test for `null`).
2. **An admin passing their own ID** (`userId === admin.$id`) must behave as "self" (`isOnBehalf: false`). Otherwise the admin gets on-behalf privileges for their own bookings, such as booking a lesson in the past. Pinned in Task 1.
3. **Email or SMTP failure must never fail a booking or cancellation.** Notifications run in `event.waitUntil` with a `.catch`. Pinned in Task 4 (handleBooking still resolves when `sendBookingNotifications` rejects).
4. **Students without an email address** (Classpass participants, admin-created students) must still be bookable, and no email is attempted. Pinned in Task 4 (no `sendMail` when `student.email` is null).
5. **Anonymous visitors on `/lessen` must still see correct "plekken" counts** after IDs are removed. Classpass bookings are excluded from the count via `source`. Pinned in Task 3 (public shape keeps `source`).

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `server/test-utils/index.ts` | Create | Shared Vitest scaffolding: `createQueuedDb()` and `asUser()` |
| `server/utils/auth.ts` | Modify | Add `requireSelfOrAdmin` |
| `server/utils/auth.test.ts` | Modify | Unit tests for `requireSelfOrAdmin` |
| `server/test-setup.ts` | Modify | Provide the real `requireSelfOrAdmin` plus stubs for `nestBookingsWithLessons` and `sendBookingNotifications` |
| `server/api/bookings.post.ts`, `credits/history.post.ts`, `health/update.post.ts`, `updatePrefs.post.ts`, `students/update-profile.post.ts`, `handleBooking.post.ts` | Modify | Use `requireSelfOrAdmin` |
| `server/api/ownership.test.ts` | Create | Table-driven IDOR regression suite |
| `server/api/health/update.post.test.ts`, `students/update-profile.post.test.ts` | Modify | Switch auth stubbing to `asUser` |
| `server/utils/queries.ts` | Modify | Public booking shape in `nestLessonsWithBookings` is `{ source }` only |
| `server/utils/queries.test.ts` | Create | Tests for public vs admin booking shape |
| `server/api/lessons.get.ts` | Modify | Select only `lessonId` and `source` from bookings |
| `app/plugins/rav.ts` | Modify | Remove unused `checkAvailability` (reads the removed `students.$id`) |
| `server/utils/bookingNotifications.ts` | Create | Build and send booking/cancellation emails and admin pushes from DB data |
| `server/utils/bookingNotifications.test.ts` | Create | Tests for the notification util |
| `server/api/handleBooking.post.test.ts`, `server/api/cancelBooking.post.test.ts` | Create | Notification wiring tests |
| `server/api/cancelBooking.post.ts` | Modify | Trigger cancellation notification |
| `server/api/sendBookingConfirmation.post.ts`, `server/api/sendBookingCancellation.post.ts` | Delete | Replaced by the server util |
| `app/composables/useBookingActions.ts` | Modify | Remove `sendEmail` and its two calls |
| `server/api/route-guards.test.ts` | Create | Fails when a new route has no auth guard and isn't allowlisted |

---

### Task 1: `requireSelfOrAdmin` helper + shared test utilities

**Files:**
- Create: `server/test-utils/index.ts`
- Modify: `server/utils/auth.ts` (append after `requireAdmin`)
- Modify: `server/test-setup.ts`
- Test: `server/utils/auth.test.ts`

**Interfaces:**
- Produces:
  - `requireSelfOrAdmin(event: H3Event, requestedId?: unknown): Promise<{ user: AuthenticatedUser; targetId: string; isOnBehalf: boolean }>`
    - `requestedId` is `undefined`, `null`, `''`, or equal to `user.$id` → `{ targetId: user.$id, isOnBehalf: false }`
    - `requestedId` is not a string → 400 `'Ongeldige gebruiker'`
    - a different string and the user is an admin → `{ targetId: requestedId, isOnBehalf: true }`
    - a different string and the user is not an admin → 403 `'Geen toegang'`
    - no session → 401 (from `requireAuth`)
  - `createQueuedDb(results?: any[][])`: a Drizzle stand-in. Each awaited `select` chain resolves to the next entry of `results` (or `[]`). Exposes `db.select`, `db.insert`, `db.update`, `db.delete` (all `vi.fn`) and persistent write chains `db.inserter`, `db.updater`, `db.deleter` with `.values` / `.set` / `.where` / `.returning` spies.
  - `asUser(id: string, opts?: { admin?: boolean; email?: string | null; name?: string })`: stubs the global `getSessionUser` so `requireAuth` returns that user.

- [ ] **Step 1: Create the shared test utilities**

`server/test-utils/index.ts`:

```ts
import { vi } from 'vitest'

/**
 * Chainable Drizzle stand-in for route tests.
 * Every awaited select chain (via `.limit()` or a bare `await`) resolves to the
 * next entry in `results`, in call order. Missing entries resolve to [].
 */
export function createQueuedDb(results: any[][] = []) {
    let index = 0
    const next = () => Promise.resolve(results[index++] ?? [])

    const selectChain: any = {}
    for (const method of ['from', 'where', 'innerJoin', 'leftJoin', 'orderBy', 'groupBy']) {
        selectChain[method] = vi.fn(() => selectChain)
    }
    selectChain.limit = vi.fn(() => next())
    selectChain.then = (ok: any, fail: any) => next().then(ok, fail)

    const writeChain = () => {
        const chain: any = {}
        for (const method of ['values', 'set', 'where', 'onConflictDoNothing', 'onConflictDoUpdate']) {
            chain[method] = vi.fn(() => chain)
        }
        chain.returning = vi.fn(() => Promise.resolve([{ id: 'mock-id' }]))
        chain.then = (ok: any, fail: any) => Promise.resolve([]).then(ok, fail)
        return chain
    }

    const inserter = writeChain()
    const updater = writeChain()
    const deleter = writeChain()

    return {
        select: vi.fn(() => selectChain),
        insert: vi.fn(() => inserter),
        update: vi.fn(() => updater),
        delete: vi.fn(() => deleter),
        selectChain,
        inserter,
        updater,
        deleter,
    }
}

/** Makes `requireAuth` (and everything built on it) see the given user. */
export function asUser(
    id: string,
    opts: { admin?: boolean; email?: string | null; name?: string } = {}
) {
    vi.stubGlobal('getSessionUser', vi.fn().mockResolvedValue({
        userId: id,
        email: opts.email === undefined ? `${id}@test.nl` : opts.email,
        name: opts.name ?? id,
        isAdmin: opts.admin ?? false,
    }))
}
```

- [ ] **Step 2: Write the failing helper tests**

Append to `server/utils/auth.test.ts`. Change the import on line 2 to `import { requireAuth, requireAdmin, requireSelfOrAdmin } from './auth'` and add `import { asUser } from '../test-utils'`.

```ts
describe('requireSelfOrAdmin', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it.each([undefined, null, ''])('treats %s as the logged-in user', async (requested) => {
    asUser('student-a')
    await expect(requireSelfOrAdmin({} as any, requested)).resolves.toMatchObject({
      targetId: 'student-a',
      isOnBehalf: false,
    })
  })

  it('lets a student act on their own id', async () => {
    asUser('student-a')
    await expect(requireSelfOrAdmin({} as any, 'student-a')).resolves.toMatchObject({
      targetId: 'student-a',
      isOnBehalf: false,
    })
  })

  it('rejects a student acting on another student with 403', async () => {
    asUser('student-a')
    await expect(requireSelfOrAdmin({} as any, 'student-b')).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'Geen toegang',
    })
  })

  it('lets an admin act on another student', async () => {
    asUser('admin-1', { admin: true })
    await expect(requireSelfOrAdmin({} as any, 'student-b')).resolves.toMatchObject({
      targetId: 'student-b',
      isOnBehalf: true,
    })
  })

  it('treats an admin passing their own id as self (not on behalf)', async () => {
    asUser('admin-1', { admin: true })
    await expect(requireSelfOrAdmin({} as any, 'admin-1')).resolves.toMatchObject({
      targetId: 'admin-1',
      isOnBehalf: false,
    })
  })

  it.each([123, ['student-b'], { id: 'student-b' }])('rejects non-string id %j with 400', async (requested) => {
    asUser('admin-1', { admin: true })
    await expect(requireSelfOrAdmin({} as any, requested)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 401 without a session', async () => {
    vi.stubGlobal('getSessionUser', vi.fn().mockResolvedValue(null))
    await expect(requireSelfOrAdmin({} as any, 'student-b')).rejects.toMatchObject({ statusCode: 401 })
  })
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `yarn test:unit server/utils/auth.test.ts`
Expected: FAIL, `requireSelfOrAdmin` is not exported / not a function.

- [ ] **Step 4: Implement the helper**

Append to `server/utils/auth.ts`:

```ts
/**
 * Resolves whose data a request operates on.
 * Students can only act on themselves; admins may pass another student's id.
 * Missing/empty ids (and an admin's own id) mean "self".
 */
export async function requireSelfOrAdmin(
    event: H3Event,
    requestedId?: unknown
): Promise<{ user: AuthenticatedUser; targetId: string; isOnBehalf: boolean }> {
    const user = await requireAuth(event)

    if (requestedId === undefined || requestedId === null || requestedId === '' || requestedId === user.$id) {
        return { user, targetId: user.$id, isOnBehalf: false }
    }

    if (typeof requestedId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Ongeldige gebruiker' })
    }

    if (!user.labels.includes('admin')) {
        throw createError({ statusCode: 403, statusMessage: 'Geen toegang' })
    }

    return { user, targetId: requestedId, isOnBehalf: true }
}
```

- [ ] **Step 5: Expose the real helper to all route tests**

In `server/test-setup.ts`, add at the top below `import { vi } from 'vitest'`:

```ts
import { requireSelfOrAdmin } from './utils/auth'
```

and in the "Server utils auto-imports" block, below `vi.stubGlobal('requireAdmin', vi.fn())`:

```ts
// Real implementation: route tests drive it through asUser() → getSessionUser
vi.stubGlobal('requireSelfOrAdmin', requireSelfOrAdmin)
vi.stubGlobal('nestBookingsWithLessons', vi.fn((rows: any[]) => ({ rows, total: rows.length })))
```

- [ ] **Step 6: Run the whole suite**

Run: `yarn test:unit`
Expected: PASS. 64 existing tests plus 11 new `requireSelfOrAdmin` tests.

- [ ] **Step 7: Commit**

```bash
git add server/test-utils/index.ts server/utils/auth.ts server/utils/auth.test.ts server/test-setup.ts
git commit -m "Add requireSelfOrAdmin ownership helper and shared test utils

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Move ID-taking routes onto `requireSelfOrAdmin` + IDOR regression suite

**Files:**
- Create: `server/api/ownership.test.ts`
- Modify: `server/api/bookings.post.ts:5-11`
- Modify: `server/api/credits/history.post.ts:8-14`
- Modify: `server/api/health/update.post.ts:6-16,29,34,44,66`
- Modify: `server/api/updatePrefs.post.ts:6-17,35`
- Modify: `server/api/students/update-profile.post.ts:9-18,49`
- Modify: `server/api/handleBooking.post.ts:6-44`
- Modify: `server/api/health/update.post.test.ts`, `server/api/students/update-profile.post.test.ts`

**Interfaces:**
- Consumes: `requireSelfOrAdmin`, `createQueuedDb`, `asUser` (Task 1)
- Produces: in `handleBooking.post.ts`, the local variables `user`, `targetUserId`, `isOnBehalf`, `isAdmin` that Task 4 relies on.

**Behaviour change (intended):** `POST /api/bookings` and `POST /api/credits/history` currently ignore another student's ID silently and return the caller's own data. They will now return 403. The client only ever sends the logged-in user's own ID there (`app/composables/useBookings.ts:8`, `useCredits.ts:8`), so nothing in the UI changes.

- [ ] **Step 1: Write the failing regression suite**

`server/api/ownership.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createQueuedDb, asUser } from '../test-utils'
import { requireAuth } from '../utils/auth'
import bookingsHandler from './bookings.post'
import creditHistoryHandler from './credits/history.post'
import healthUpdateHandler from './health/update.post'
import updatePrefsHandler from './updatePrefs.post'
import updateProfileHandler from './students/update-profile.post'
import handleBookingHandler from './handleBooking.post'
import cancelBookingHandler from './cancelBooking.post'

/**
 * IDOR regression suite: every route that accepts a student id from the client
 * must refuse to let one student act on another, before touching any data.
 */
const routes = [
    { route: 'POST /api/bookings', handler: bookingsHandler, body: (id: string) => ({ userId: id }) },
    { route: 'POST /api/credits/history', handler: creditHistoryHandler, body: (id: string) => ({ studentId: id }) },
    { route: 'POST /api/health/update', handler: healthUpdateHandler, body: (id: string) => ({ userId: id, injury: 'knie' }) },
    { route: 'POST /api/updatePrefs', handler: updatePrefsHandler, body: (id: string) => ({ userId: id, reminders: true }) },
    { route: 'POST /api/students/update-profile', handler: updateProfileHandler, body: (id: string) => ({ userId: id, name: 'Overgenomen' }) },
    { route: 'POST /api/handleBooking', handler: handleBookingHandler, body: (id: string) => ({ lessonId: 'lesson-1', onBehalfOfUserId: id }) },
]

let db: ReturnType<typeof createQueuedDb>
const event = () => ({ waitUntil: vi.fn() } as any)
const touchedData = () => [db.select, db.insert, db.update, db.delete].some((fn) => fn.mock.calls.length > 0)

beforeEach(() => {
    vi.restoreAllMocks()
    db = createQueuedDb()
    vi.stubGlobal('db', db)
    vi.stubGlobal('readBody', vi.fn())
    // Real auth so routes still on requireAuth (cancelBooking) are exercised too
    vi.stubGlobal('requireAuth', requireAuth)
    vi.stubGlobal('findAvailableCredit', vi.fn().mockResolvedValue(null))
    vi.stubGlobal('countRegularLessonBookings', vi.fn().mockResolvedValue(0))
})

describe.each(routes)('$route ownership', ({ handler, body }) => {
    const handle = handler as any

    it('rejects a student acting on another student with 403 and touches no data', async () => {
        asUser('student-a')
        vi.mocked(readBody).mockResolvedValue(body('student-b'))

        await expect(handle(event())).rejects.toMatchObject({ statusCode: 403 })
        expect(touchedData()).toBe(false)
    })

    it('lets an admin act on another student', async () => {
        asUser('admin-1', { admin: true })
        vi.mocked(readBody).mockResolvedValue(body('student-b'))

        const error = await handle(event()).then(() => null, (e: any) => e)

        expect(error?.statusCode).not.toBe(403)
        expect(touchedData()).toBe(true)
    })
})

describe('POST /api/cancelBooking ownership', () => {
    it("rejects cancelling another student's booking with 403 and deletes nothing", async () => {
        db = createQueuedDb([[{ id: 'booking-1', lessonId: 'lesson-1', studentId: 'student-b', source: 'regular', lessonDate: new Date(Date.now() + 7 * 864e5) }]])
        vi.stubGlobal('db', db)
        asUser('student-a')
        vi.mocked(readBody).mockResolvedValue({ bookingId: 'booking-1' })

        await expect((cancelBookingHandler as any)(event())).rejects.toMatchObject({ statusCode: 403 })
        expect(db.delete).not.toHaveBeenCalled()
        expect(db.update).not.toHaveBeenCalled()
    })
})
```

- [ ] **Step 2: Run the suite to see which routes fail**

Run: `yarn test:unit server/api/ownership.test.ts`
Expected: the 403 test FAILS for `bookings` and `credits/history`, which today resolve with the caller's own data instead of a 403. All other cases PASS, because their hand-written checks are already correct. The suite pins that behaviour so the refactor in Step 3 can't break it.

- [ ] **Step 3: Refactor the routes**

`server/api/bookings.post.ts`: replace lines 5–11 with:

```ts
    const body = await readBody(event)
    const { targetId: targetUserId } = await requireSelfOrAdmin(event, body?.userId)
```

`server/api/credits/history.post.ts`: replace lines 8–14 with:

```ts
    const body = await readBody(event)
    const { targetId: targetUserId } = await requireSelfOrAdmin(event, body?.studentId)
```

`server/api/health/update.post.ts`: replace lines 6–16 with:

```ts
    const body = await readBody(event)
    const { user: authUser, targetId, isOnBehalf } = await requireSelfOrAdmin(event, body?.userId)
```

then in the rest of the file replace every `body.userId` with `targetId` (original lines 24, 34, 44, 66), and replace the self-healing condition (original line 29) with `if (isOnBehalf) {`.

`server/api/updatePrefs.post.ts`: replace lines 6–17 with:

```ts
    const body = await readBody(event)
    const { targetId } = await requireSelfOrAdmin(event, body?.userId)
```

and replace `eq(students.id, body.userId)` (original line 35) with `eq(students.id, targetId)`. Keep the `createError` import; the "Geen geldige velden" 400 still uses it.

`server/api/students/update-profile.post.ts`: replace lines 9–18 with:

```ts
    const body = await readBody(event)
    const { user: authUser, targetId: userId, isOnBehalf } = await requireSelfOrAdmin(event, body?.userId)
```

and replace the self-healing condition on line 49 with `if (isOnBehalf) {`.

`server/api/handleBooking.post.ts`: replace lines 6–44 (from `const user = await requireAuth(event)` through the past-lesson check) with:

```ts
    const body = await readBody(event)
    const { user, targetId: targetUserId, isOnBehalf } = await requireSelfOrAdmin(event, body?.onBehalfOfUserId)

    if (!body?.lessonId || typeof body.lessonId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'lessonId is verplicht' })
    }

    const isAdmin = user.labels.includes('admin')
    const source: 'regular' | 'classpass' = body.source === 'classpass' ? 'classpass' : 'regular'

    if (source === 'classpass' && !isAdmin) {
        throw createError({ statusCode: 403, statusMessage: 'Alleen admins kunnen Classpass boekingen toevoegen' })
    }

    if (source === 'classpass' && !isOnBehalf) {
        throw createError({ statusCode: 400, statusMessage: 'Selecteer een deelnemer voor de Classpass boeking' })
    }

    // Fetch lesson
    const lessonRows = await db.select().from(lessons).where(eq(lessons.id, body.lessonId)).limit(1)
    if (lessonRows.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'Les niet gevonden' })
    }
    const lesson = lessonRows[0]

    // Admins booking for a student may add them to past lessons (attendance correction)
    if (!isOnBehalf && new Date(lesson.date) <= new Date()) {
        throw createError({ statusCode: 400, statusMessage: 'Kan niet boeken voor een les in het verleden' })
    }
```

- [ ] **Step 4: Update the two existing route tests to the new auth path**

In both `server/api/health/update.post.test.ts` and `server/api/students/update-profile.post.test.ts`:
- add `import { asUser } from '../../test-utils'` below the vitest import
- delete the line `vi.stubGlobal('requireAuth', vi.fn())` in `beforeEach`
- replace each `vi.mocked(requireAuth).mockResolvedValue({ $id: 'user-123', email: 'user@test.com', name: 'Test User', labels: [] })` with `asUser('user-123', { email: 'user@test.com', name: 'Test User' })`
- replace each `vi.mocked(requireAuth).mockResolvedValue({ $id: 'admin-id', email: 'admin@test.com', name: 'Admin User', labels: ['admin'] })` with `asUser('admin-id', { admin: true, email: 'admin@test.com', name: 'Admin User' })`

Keep the rest of each test (mockDb, assertions) unchanged.

- [ ] **Step 5: Run the whole suite**

Run: `yarn test:unit`
Expected: PASS, including 13 new ownership tests (6 routes × 2 + cancelBooking).

- [ ] **Step 6: Smoke-test in the browser**

Run `yarn dev`. As a normal student: open `/account` (bookings and credits load), book and cancel a lesson on `/lessen`, and save health info. As admin: book on behalf of a student and open that student's details. Expected: everything works as before.

- [ ] **Step 7: Commit**

```bash
git add server/api server/test-utils
git commit -m "Route all student-id checks through requireSelfOrAdmin

Adds a table-driven IDOR regression suite. /api/bookings and
/api/credits/history now return 403 instead of silently falling back.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Stop leaking booking and student IDs on the public lessons feed

**Files:**
- Create: `server/utils/queries.test.ts`
- Modify: `server/utils/queries.ts:129-137` (booking object in `nestLessonsWithBookings`)
- Modify: `server/api/lessons.get.ts:17-20`
- Modify: `app/plugins/rav.ts:113-115` (remove `checkAvailability`)

**Interfaces:**
- Produces: the public booking shape `{ source: 'regular' | 'classpass' }`. The admin shape (`includeStudents = true`, used by `lessonsWithBookings.get.ts` and `lessonsArchive.get.ts`) is unchanged.

**Why no `isMine` flag:** `/lessen` already works out "is this mine?" from `/api/bookings` (`app/pages/lessen.vue:38-49`, `bookingByLessonId`), so the public feed doesn't need it.

**Client usage verified:** `lessen.vue:59-65` reads only `b.source`. `BookingModal.vue:35` reads only `bookings.length`. `rav.checkAvailability` reads `x.students.$id` but nothing calls it (confirm with the grep in Step 5).

- [ ] **Step 1: Write the failing tests**

`server/utils/queries.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { nestLessonsWithBookings } from './queries'

const lesson = { id: 'lesson-1', date: new Date('2026-10-04T07:45:00Z'), type: 'hatha', teacher: 'Ravennah', maxSpots: 9 }
const booking = {
    id: 'booking-1', lessonId: 'lesson-1', source: 'classpass', isFirstTime: true,
    studentId: 'student-b', studentName: 'Bea', studentEmail: 'bea@test.nl',
}

describe('nestLessonsWithBookings', () => {
    it('exposes only the booking source on the public feed', () => {
        const { rows } = nestLessonsWithBookings([lesson], [booking])
        expect(rows[0].bookings).toEqual([{ source: 'classpass' }])
    })

    it('defaults a missing source to regular so spot counts stay correct', () => {
        const { rows } = nestLessonsWithBookings([lesson], [{ ...booking, source: null }])
        expect(rows[0].bookings).toEqual([{ source: 'regular' }])
    })

    it('keeps full student details for admin views', () => {
        const { rows } = nestLessonsWithBookings([lesson], [booking], true)
        expect(rows[0].bookings[0]).toMatchObject({
            $id: 'booking-1',
            students: { $id: 'student-b', name: 'Bea', email: 'bea@test.nl' },
        })
    })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn test:unit server/utils/queries.test.ts`
Expected: the first two tests FAIL (the booking still contains `$id`, `lessons`, `isFirstTime`, `students`); the admin test passes.

- [ ] **Step 3: Implement the public shape**

In `server/utils/queries.ts`, replace the `const booking: any = { ... }` block (lines 129–137) with:

```ts
    const source = b.source ?? 'regular'
    // Public feed: only what's needed to count spots — no booking or student ids.
    const booking: any = includeStudents
      ? {
          $id: b.id,
          lessons: b.lessonId,
          source,
          isFirstTime: b.isFirstTime ?? false,
          students: b.studentName
            ? { $id: b.studentId, name: b.studentName, email: b.studentEmail, injury: b.studentInjury ?? null, pregnancy: b.studentPregnancy ?? false }
            : b.studentId,
        }
      : { source }
```

- [ ] **Step 4: Stop selecting the IDs in the first place**

In `server/api/lessons.get.ts`, replace lines 17–20:

```ts
        bookingRows = await db
            .select({ lessonId: bookings.lessonId, source: bookings.source })
            .from(bookings)
            .where(inArray(bookings.lessonId, lessonIds))
```

- [ ] **Step 5: Remove the dead `checkAvailability` helper**

First confirm it's unused:

Run: `grep -rn "checkAvailability" app e2e server`
Expected: only `app/plugins/rav.ts:113`.

Then delete these lines from `app/plugins/rav.ts`:

```ts
        checkAvailability(lesson: any, student: any) {
            return lesson ? !lesson.bookings.some((x: any) => x.students.$id == student.$id) : false
        },

```

- [ ] **Step 6: Run the whole suite**

Run: `yarn test:unit`
Expected: PASS.

- [ ] **Step 7: Verify the payload and the page**

With `yarn dev` running, logged out: `curl -s localhost:3000/api/lessons | grep -c studentId`
Expected: `0`.

Open `/lessen` logged out, then again as a student. Expected: the "plekken" badges show the same numbers as on master, and as a student your booked lessons still show the cancel button.

- [ ] **Step 8: Commit**

```bash
git add server/utils/queries.ts server/utils/queries.test.ts server/api/lessons.get.ts app/plugins/rav.ts
git commit -m "Stop exposing booking and student ids on public lessons feed

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Send booking emails from the server, using database data

**Files:**
- Create: `server/utils/bookingNotifications.ts`
- Create: `server/utils/bookingNotifications.test.ts`
- Create: `server/api/handleBooking.post.test.ts`
- Create: `server/api/cancelBooking.post.test.ts`
- Modify: `server/api/handleBooking.post.ts` (after the credit update)
- Modify: `server/api/cancelBooking.post.ts` (after the booking delete)
- Modify: `server/test-setup.ts`
- Modify: `app/composables/useBookingActions.ts:22-27,52-56,69-79`
- Delete: `server/api/sendBookingConfirmation.post.ts`, `server/api/sendBookingCancellation.post.ts`

**Interfaces:**
- Consumes: `targetUserId`, `isOnBehalf`, `isAdmin`, `source`, `lesson` in `handleBooking.post.ts` (Task 2). Auto-imported utils: `findAvailableCredit` (`server/utils/queries.ts:63`); `formatLessonDate`, `formatISODate`, `formatHour`, `formatMinutes` (`server/utils/dates.ts`); `bookingStudentEmail`, `bookingAdminEmail`, `cancellationStudentEmail`, `cancellationAdminEmail` (`server/utils/emailTemplates.ts`); `smtpTransport`; `sendPushToAdmins` (`server/utils/push.ts:83`).
- Produces: `sendBookingNotifications(kind: 'confirmation' | 'cancellation', target: { lessonId: string; studentId: string }): Promise<void>`

**When emails are sent (same rules the client applies today, `useBookingActions.ts:25,54`):**
- Confirmation: `source === 'regular'`, the lesson is not an admin booking into the past, and the student has an email address.
- Cancellation: `booking.source !== 'classpass'`, `booking.studentId` is set, and the student has an email address.

**Behaviour note:** the "plekken over" count in the admin email stays `maxSpots - allBookings` (Classpass included), exactly as today. Changing it is out of scope.

- [ ] **Step 1: Write the failing util tests**

`server/utils/bookingNotifications.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createQueuedDb } from '../test-utils'
import { sendBookingNotifications } from './bookingNotifications'

const lesson = { id: 'lesson-1', date: new Date('2026-10-04T07:45:00Z'), type: 'hatha', teacher: 'Ravennah', maxSpots: 9 }
const student = { name: 'Bea uit DB', email: 'bea@test.nl' }
const mail = { subject: 's', html: 'h', text: 't' }

beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal('smtpTransport', { sendMail: vi.fn().mockResolvedValue({ accepted: [] }) })
    vi.stubGlobal('sendPushToAdmins', vi.fn().mockResolvedValue(1))
    vi.stubGlobal('findAvailableCredit', vi.fn().mockResolvedValue({ id: 'credit-1' }))
    for (const fn of ['bookingStudentEmail', 'bookingAdminEmail', 'cancellationStudentEmail', 'cancellationAdminEmail']) {
        vi.stubGlobal(fn, vi.fn().mockReturnValue(mail))
    }
    for (const fn of ['formatLessonDate', 'formatISODate', 'formatHour', 'formatMinutes']) {
        vi.stubGlobal(fn, vi.fn().mockReturnValue('x'))
    }
})

describe('sendBookingNotifications', () => {
    it('uses the name and email from the database for a confirmation', async () => {
        vi.stubGlobal('db', createQueuedDb([[lesson], [student], [{ studentName: 'Bea uit DB' }]]))

        await sendBookingNotifications('confirmation', { lessonId: 'lesson-1', studentId: 'student-b' })

        expect(bookingStudentEmail).toHaveBeenCalledWith(expect.objectContaining({ name: 'Bea uit DB' }))
        expect(bookingAdminEmail).toHaveBeenCalledWith(expect.objectContaining({ name: 'Bea uit DB', email: 'bea@test.nl', spots: 8 }))
        expect(smtpTransport.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'bea@test.nl' }))
        expect(smtpTransport.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'info@ravennah.com' }))
        expect(sendPushToAdmins).toHaveBeenCalledWith(expect.objectContaining({ title: 'Nieuwe boeking' }))
    })

    it('alerts the admin when the student has no credits left after booking', async () => {
        vi.stubGlobal('db', createQueuedDb([[lesson], [student], []]))
        vi.mocked(findAvailableCredit).mockResolvedValue(null)

        await sendBookingNotifications('confirmation', { lessonId: 'lesson-1', studentId: 'student-b' })

        expect(sendPushToAdmins).toHaveBeenCalledWith(expect.objectContaining({ title: 'Credits op' }))
    })

    it('sends cancellation templates without a credit check', async () => {
        vi.stubGlobal('db', createQueuedDb([[lesson], [student], []]))

        await sendBookingNotifications('cancellation', { lessonId: 'lesson-1', studentId: 'student-b' })

        expect(cancellationStudentEmail).toHaveBeenCalledWith(expect.objectContaining({ name: 'Bea uit DB' }))
        expect(bookingStudentEmail).not.toHaveBeenCalled()
        expect(findAvailableCredit).not.toHaveBeenCalled()
        expect(sendPushToAdmins).toHaveBeenCalledWith(expect.objectContaining({ title: 'Annulering' }))
    })

    it('sends nothing when the student has no email address', async () => {
        vi.stubGlobal('db', createQueuedDb([[lesson], [{ name: 'Classpass gast', email: null }]]))

        await sendBookingNotifications('confirmation', { lessonId: 'lesson-1', studentId: 'student-c' })

        expect(smtpTransport.sendMail).not.toHaveBeenCalled()
        expect(sendPushToAdmins).not.toHaveBeenCalled()
    })

    it('keeps going when one email fails', async () => {
        vi.stubGlobal('db', createQueuedDb([[lesson], [student], []]))
        vi.mocked(smtpTransport.sendMail).mockRejectedValueOnce(new Error('smtp down'))

        await expect(sendBookingNotifications('confirmation', { lessonId: 'lesson-1', studentId: 'student-b' })).resolves.toBeUndefined()
        expect(smtpTransport.sendMail).toHaveBeenCalledTimes(2)
        expect(sendPushToAdmins).toHaveBeenCalled()
    })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn test:unit server/utils/bookingNotifications.test.ts`
Expected: FAIL, cannot find module `./bookingNotifications`.

- [ ] **Step 3: Implement the util**

`server/utils/bookingNotifications.ts` (logic merged from the two `send*.post.ts` endpoints; the name and email now come from the `students` row):

```ts
import { eq } from 'drizzle-orm'
import { lessons, bookings, students } from '../database/schema'

export type BookingNotificationKind = 'confirmation' | 'cancellation'

const FROM = 'Yoga Ravennah <info@ravennah.com>'
const ADMIN_EMAIL = 'info@ravennah.com'

function lessonTitle(lesson: { type: string | null; teacher: string | null }) {
    if (lesson.type === 'guest lesson') return `Yin-Yang Yoga door gastdocent ${lesson.teacher}`
    return lesson.type === 'peachy bum' ? 'Peachy Bum' : 'Hatha Yoga'
}

function calendarLinks(lesson: { type: string | null }, lessonDate: Date) {
    const address = lesson.type === 'peachy bum'
        ? 'Kosboulevard 5, 3059 XZ Rotterdam'
        : 'Emmy van Leersumhof 24a, 3059 LT Rotterdam'
    const title = lesson.type === 'peachy bum' ? 'Peachy Bum les' : 'Hatha Yoga les'
    const link = (stream: string) =>
        `https://calndr.link/d/event/?service=${stream}&start=${formatISODate(lessonDate)}%20${formatHour(lessonDate)}:${formatMinutes(lessonDate)}&title=${title}%20Ravennah&timezone=Europe/Amsterdam&location=${encodeURIComponent(address)}`
    return { apple: link('apple'), google: link('gmail'), outlook: link('outlook') }
}

/**
 * Emails the student + studio and pushes to admins after a booking change.
 * All personal data is read from the database — never from the request.
 */
export async function sendBookingNotifications(
    kind: BookingNotificationKind,
    { lessonId, studentId }: { lessonId: string; studentId: string }
): Promise<void> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1)
    const [student] = await db
        .select({ name: students.name, email: students.email })
        .from(students)
        .where(eq(students.id, studentId))
        .limit(1)

    if (!lesson || !student?.email) return

    const bookingRows = await db
        .select({ studentName: students.name })
        .from(bookings)
        .leftJoin(students, eq(bookings.studentId, students.id))
        .where(eq(bookings.lessonId, lessonId))

    const isConfirmation = kind === 'confirmation'
    const label = isConfirmation ? 'BookingConfirmation' : 'BookingCancellation'
    const lessonDate = new Date(lesson.date!)
    const lessonType = lessonTitle(lesson)
    const formattedDate = formatLessonDate(lessonDate)

    const adminData = {
        name: student.name,
        email: student.email,
        lessonType,
        lessonDate: formattedDate,
        spots: lesson.maxSpots - bookingRows.length,
        bookings: bookingRows.map((b) => ({ name: b.studentName ?? 'Onbekend' })),
    }

    const studentMail = isConfirmation
        ? bookingStudentEmail({ name: student.name, lessonType, lessonDate: formattedDate, calendarLinks: calendarLinks(lesson, lessonDate) })
        : cancellationStudentEmail({ name: student.name, lessonType, lessonDate: formattedDate })
    const adminMail = isConfirmation ? bookingAdminEmail(adminData) : cancellationAdminEmail(adminData)

    await Promise.allSettled(
        [
            { label: 'student', to: student.email, ...studentMail },
            { label: 'admin', to: ADMIN_EMAIL, ...adminMail },
        ].map(async (mail) => {
            try {
                const result = await smtpTransport.sendMail({ from: FROM, to: mail.to, subject: mail.subject, html: mail.html, text: mail.text })
                console.log(`[${label}] ${mail.label} email sent:`, result?.accepted)
            } catch (err: any) {
                console.error(`[${label}] ${mail.label} email failed:`, err?.message ?? err)
            }
        })
    )

    const pushes = [{
        title: isConfirmation ? 'Nieuwe boeking' : 'Annulering',
        body: `${student.name} heeft ${lessonType} ${isConfirmation ? 'geboekt' : 'geannuleerd'} op ${formattedDate}`,
        url: '/account',
    }]
    if (isConfirmation && !(await findAvailableCredit(studentId))) {
        pushes.push({ title: 'Credits op', body: `${student.name} heeft geen credits meer`, url: '/account' })
    }

    for (const push of pushes) {
        try {
            await sendPushToAdmins(push)
        } catch (err: any) {
            console.error(`[${label}] Admin push failed:`, err?.message ?? err)
        }
    }
}
```

- [ ] **Step 4: Run the util tests**

Run: `yarn test:unit server/utils/bookingNotifications.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Write the failing wiring tests**

Add to `server/test-setup.ts` below the `nestBookingsWithLessons` stub:

```ts
vi.stubGlobal('sendBookingNotifications', vi.fn().mockResolvedValue(undefined))
```

`server/api/handleBooking.post.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createQueuedDb, asUser } from '../test-utils'
import handler from './handleBooking.post'

const future = { id: 'lesson-1', date: new Date(Date.now() + 7 * 864e5), type: 'hatha', teacher: 'R', maxSpots: 9 }
const past = { ...future, date: new Date(Date.now() - 864e5) }
const handle = handler as any
let event: any

function setup(lesson: any) {
    vi.stubGlobal('db', createQueuedDb([[lesson], []]))
}

beforeEach(() => {
    vi.restoreAllMocks()
    event = { waitUntil: vi.fn() }
    vi.stubGlobal('readBody', vi.fn())
    vi.stubGlobal('findAvailableCredit', vi.fn().mockResolvedValue({ id: 'credit-1' }))
    vi.stubGlobal('countRegularLessonBookings', vi.fn().mockResolvedValue(1))
    vi.stubGlobal('sendBookingNotifications', vi.fn().mockResolvedValue(undefined))
})

describe('POST /api/handleBooking notifications', () => {
    it('notifies for the booked student, not a client-supplied name', async () => {
        setup(future)
        asUser('student-a')
        vi.mocked(readBody).mockResolvedValue({ lessonId: 'lesson-1', onBehalfOfUserId: null, name: 'Iemand anders' })

        await handle(event)

        expect(sendBookingNotifications).toHaveBeenCalledWith('confirmation', { lessonId: 'lesson-1', studentId: 'student-a' })
        expect(event.waitUntil).toHaveBeenCalledOnce()
    })

    it('notifies for the target student when an admin books on behalf', async () => {
        setup(future)
        asUser('admin-1', { admin: true })
        vi.mocked(readBody).mockResolvedValue({ lessonId: 'lesson-1', onBehalfOfUserId: 'student-b' })

        await handle(event)

        expect(sendBookingNotifications).toHaveBeenCalledWith('confirmation', { lessonId: 'lesson-1', studentId: 'student-b' })
    })

    it('skips notifications for classpass bookings', async () => {
        setup(future)
        asUser('admin-1', { admin: true })
        vi.mocked(readBody).mockResolvedValue({ lessonId: 'lesson-1', onBehalfOfUserId: 'student-b', source: 'classpass' })

        await handle(event)

        expect(sendBookingNotifications).not.toHaveBeenCalled()
    })

    it('skips notifications when an admin adds a student to a past lesson', async () => {
        setup(past)
        asUser('admin-1', { admin: true })
        vi.mocked(readBody).mockResolvedValue({ lessonId: 'lesson-1', onBehalfOfUserId: 'student-b' })

        await handle(event)

        expect(sendBookingNotifications).not.toHaveBeenCalled()
    })

    it('still succeeds when notifications fail', async () => {
        setup(future)
        asUser('student-a')
        vi.mocked(readBody).mockResolvedValue({ lessonId: 'lesson-1' })
        vi.mocked(sendBookingNotifications).mockRejectedValue(new Error('smtp down'))

        await expect(handle(event)).resolves.toMatchObject({ success: true })
        await expect(event.waitUntil.mock.calls[0][0]).resolves.toBeUndefined()
    })
})
```

`server/api/cancelBooking.post.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createQueuedDb, asUser } from '../test-utils'
import { requireAuth } from '../utils/auth'
import handler from './cancelBooking.post'

const booking = (overrides = {}) => ({
    id: 'booking-1', lessonId: 'lesson-1', studentId: 'student-a', source: 'regular',
    lessonDate: new Date(Date.now() + 7 * 864e5), lessonType: 'hatha', ...overrides,
})
const handle = handler as any
let event: any

beforeEach(() => {
    vi.restoreAllMocks()
    event = { waitUntil: vi.fn() }
    vi.stubGlobal('requireAuth', requireAuth)
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({ bookingId: 'booking-1', name: 'Iemand anders' }))
    vi.stubGlobal('sendBookingNotifications', vi.fn().mockResolvedValue(undefined))
})

describe('POST /api/cancelBooking notifications', () => {
    it("notifies for the booking's student after deleting", async () => {
        vi.stubGlobal('db', createQueuedDb([[booking()], []]))
        asUser('student-a')

        await handle(event)

        expect(sendBookingNotifications).toHaveBeenCalledWith('cancellation', { lessonId: 'lesson-1', studentId: 'student-a' })
        expect(event.waitUntil).toHaveBeenCalledOnce()
    })

    it('skips notifications for classpass bookings', async () => {
        vi.stubGlobal('db', createQueuedDb([[booking({ source: 'classpass' })]]))
        asUser('admin-1', { admin: true })

        await handle(event)

        expect(sendBookingNotifications).not.toHaveBeenCalled()
    })
})
```

- [ ] **Step 6: Run to verify they fail**

Run: `yarn test:unit server/api/handleBooking.post.test.ts server/api/cancelBooking.post.test.ts`
Expected: FAIL. `sendBookingNotifications` is never called (the classpass/past tests pass already).

- [ ] **Step 7: Wire the notifications into the routes**

In `server/api/handleBooking.post.ts`, directly after the `if (creditId) { ... }` block and before `const regularCountAfter`:

```ts
    // Admins correcting attendance on past lessons don't trigger mails; classpass guests often have no email.
    if (source === 'regular' && !(isAdmin && new Date(lesson.date) <= now)) {
        event.waitUntil(
            sendBookingNotifications('confirmation', { lessonId: lesson.id, studentId: targetUserId })
                .catch((err: any) => console.error('[handleBooking] Notifications failed:', err?.message ?? err))
        )
    }
```

In `server/api/cancelBooking.post.ts`, directly after `await db.delete(bookings).where(eq(bookings.id, body.bookingId))`:

```ts
    if (booking.source !== 'classpass' && booking.studentId) {
        event.waitUntil(
            sendBookingNotifications('cancellation', { lessonId: booking.lessonId, studentId: booking.studentId })
                .catch((err: any) => console.error('[cancelBooking] Notifications failed:', err?.message ?? err))
        )
    }
```

- [ ] **Step 8: Run the wiring tests**

Run: `yarn test:unit server/api/handleBooking.post.test.ts server/api/cancelBooking.post.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 9: Remove the client-triggered email calls**

In `app/composables/useBookingActions.ts`:
- delete lines 22–27 (`const lessonIsInPast …` through the `sendEmail('sendBookingConfirmation', …)` block)
- delete lines 52–56 (the comment, `const target …`, and the `sendEmail('sendBookingCancellation', …)` block)
- delete the whole `sendEmail` function (lines 69–79)
- `isAdmin` in the destructure on line 2 is then unused; change the line to `const { user, refresh: refreshUser } = useAuth()`
- `cancelBooking` no longer needs the `result`; change line 44 to `await $fetch('/api/cancelBooking', {`

- [ ] **Step 10: Delete the two endpoints**

First confirm nothing else calls them:

Run: `grep -rn "sendBookingConfirmation\|sendBookingCancellation" app server e2e`
Expected: no matches.

```bash
git rm server/api/sendBookingConfirmation.post.ts server/api/sendBookingCancellation.post.ts
```

- [ ] **Step 11: Run the whole suite**

Run: `yarn test:unit`
Expected: PASS.

- [ ] **Step 12: End-to-end check against the Mailtrap sandbox**

With `yarn dev` running: as a student, book a lesson on `/lessen`, then cancel it. Expected in Mailtrap: one student plus one admin mail for each action, with the student's database name. As admin: book on behalf of a student (a mail arrives), add a Classpass booking (no mail), and add a student to a past lesson (no mail). If the test user exists, also run `TEST_EMAIL=… TEST_PASSWORD=… yarn test:booking`.

- [ ] **Step 13: Commit**

```bash
git add server app/composables/useBookingActions.ts
git commit -m "Send booking emails server-side from database data

Replaces the client-triggered sendBookingConfirmation/Cancellation
endpoints, which trusted a client-supplied name.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Route-guard inventory test

**Files:**
- Create: `server/api/route-guards.test.ts`

**Interfaces:**
- Consumes: the guard function names `requireAuth`, `requireAdmin`, `requireSelfOrAdmin`, `getSessionUser`, plus the cron check `cronSecret`.

- [ ] **Step 1: Write the test**

`server/api/route-guards.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const API_DIR = fileURLToPath(new URL('.', import.meta.url))
const GUARD = /\b(requireAuth|requireAdmin|requireSelfOrAdmin|getSessionUser)\(|cronSecret/

/** Routes that are intentionally reachable without a session. Adding one here is a security decision. */
const PUBLIC_ROUTES = [
    'auth/login.post.ts',
    'auth/logout.post.ts',
    'auth/passkeys/login/options.post.ts',
    'auth/passkeys/login/verify.post.ts',
    'auth/register.post.ts',
    'auth/request-password-reset.post.ts',
    'auth/reset-password.post.ts',
    'auth/send-otp.post.ts',
    'auth/verify-email.post.ts',
    'auth/verify-otp.post.ts',
    'lessons.get.ts',
    'mail/send.post.ts',
    'passwordRecovery.post.ts', // empty legacy file
    'ping.get.ts',
]

function routeFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) return routeFiles(full)
        return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [full] : []
    })
}

describe('API route guards', () => {
    it.each(routeFiles(API_DIR).map((f) => relative(API_DIR, f)))('%s is guarded or explicitly public', (route) => {
        if (PUBLIC_ROUTES.includes(route)) return
        expect(readFileSync(join(API_DIR, route), 'utf8')).toMatch(GUARD)
    })

    it.each(PUBLIC_ROUTES)('public allowlist entry %s still exists', (route) => {
        expect(existsSync(join(API_DIR, route))).toBe(true)
    })
})
```

- [ ] **Step 2: Run it**

Run: `yarn test:unit server/api/route-guards.test.ts`
Expected: PASS. If a route fails, it's either a real missing guard (stop and report it) or a public route missing from the list (add it with a comment saying why).

- [ ] **Step 3: Prove it catches a regression**

Temporarily change `requireAdmin(event)` to `null` in `server/api/users.get.ts` and run the test again.
Expected: FAIL on `users.get.ts`. Revert the change (`git checkout server/api/users.get.ts`) and confirm it passes.

- [ ] **Step 4: Run the whole suite and commit**

Run: `yarn test:unit`
Expected: PASS.

```bash
git add server/api/route-guards.test.ts
git commit -m "Add route-guard inventory test

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Out of scope (noted during planning)

- `server/api/passwordRecovery.post.ts` is an empty file (0 bytes). It's probably safe to delete, but that's a separate change.
- `credits/welcome.post.ts` stays strictly self-only (it doesn't let admins through), which is correct for its purpose.
- The admin email's "plekken over" count includes Classpass bookings, unlike the UI. That's existing behaviour and hasn't changed.
