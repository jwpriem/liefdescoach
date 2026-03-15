# Unit test recommendations

This project already has E2E tests, but most business logic sits in server handlers, auth utilities, and shared plugin helpers. The highest-value unit tests are the ones that protect booking rules, credit accounting, auth guards, and user-facing error mapping.

## Recommended stack

- **Vitest** for unit tests (fast, TypeScript-first).
- **`vi.mock`** for mocking `useDB`, `requireAuth`, `readBody`, and Appwrite/db dependencies.
- Optional: split business rules in handlers into pure helpers to reduce mocking overhead.

## Priority 1: booking/cancellation business rules

### `server/api/handleBooking.post.ts`

1. **Reject missing `lessonId`**
   - Input body without `lessonId`.
   - Assert 400 with `lessonId is verplicht`.
2. **Reject non-admin booking on behalf of another user**
   - Auth user without `admin` label + `onBehalfOfUserId` in body.
   - Assert 403.
3. **Reject unknown lesson**
   - DB returns no lesson rows.
   - Assert 404.
4. **Reject booking in the past**
   - Lesson date <= now.
   - Assert 400.
5. **Reject full lesson**
   - Existing bookings length >= `MAX_LESSON_CAPACITY`.
   - Assert 409.
6. **Reject duplicate booking for same student**
   - Existing bookings contains `studentId === targetUserId`.
   - Assert 409.
7. **Reject no available credit**
   - `findAvailableCredit` returns null.
   - Assert 402.
8. **Happy path creates booking + claims credit**
   - Assert `insert(bookings)` called with generated `bookingId`.
   - Assert `update(credits)` called with `bookingId` and `usedAt`.
   - Assert response includes `success: true` and expected `spots`.

### `server/api/cancelBooking.post.ts`

1. **Reject missing `bookingId`** -> 400.
2. **Reject unknown booking** -> 404.
3. **Reject cancellation by another non-admin user** -> 403.
4. **Reject within 24h for non-admin** -> 400.
5. **Allow admin cancellation within 24h**
   - Assert no 24h rejection for admin.
6. **Release credit if linked**
   - Booking has credit row.
   - Assert credit is reset to `bookingId: null, usedAt: null`.
7. **Delete booking always on success**
   - Assert delete query executes.
8. **Response shape**
   - Returns `{ success: true, lessonId }`.

## Priority 2: auth guards

### `server/utils/auth.ts`

1. **`requireAuth` returns mapped authenticated user**
   - Mock `getSessionUser` with regular user.
   - Assert labels are empty.
2. **`requireAuth` maps admin flag to `['admin']`**
   - Mock `isAdmin: true`.
3. **`requireAuth` throws 401 when session missing**.
4. **`requireAdmin` throws 403 for non-admin**.
5. **`requireAdmin` returns user for admin**.

## Priority 3: store behavior and UX error mapping

### `stores/index.ts` (`fetchWrapper`)

1. **Sets and clears loading state around callback**.
2. **Clears stale `errorMessage` before run**.
3. **Returns false and keeps `errorMessage` empty when `ignore401` is true + 401**.
4. **Maps server status message to friendly message**.
5. **Maps known patterns**:
   - 409 -> email already in use message.
   - invalid credentials -> login message.
   - password too short -> password message.
   - 429 -> retry later message.
   - 402 -> insufficient credits message.
6. **Returns true on success** and false on failures.

## Priority 4: shared UI/business helpers

### `plugins/rav.ts`

Focus on deterministic helpers that are easy to test and frequently reused:

1. **`checkLessonType`**
   - `'peachy bum'` => `'Peachy Bum'`, default => `'Hatha Yoga'`.
2. **`getLessonTitle` / `getLessonDescription`**
   - Guest lesson formatting includes teacher.
   - Non-guest falls back to `checkLessonType`.
3. **`checkAvailability`**
   - Returns false when student already booked.
   - Returns true when seat is available.
4. **`formatPhoneNumber`**
   - Converts Dutch `06...` into `+31...` format.
   - Keeps already normalized `31...` values.
5. **`setErrorMessages` / `getErrorMessage`**
   - Maps validation keys (`required`, `email`, `minLength`) to Dutch strings.

## Suggested rollout order

1. Add tests for `requireAuth`/`requireAdmin` (low setup cost).
2. Add tests for `fetchWrapper` (high UX impact).
3. Add tests for booking/cancellation handlers (highest business value).
4. Add helper tests in `plugins/rav.ts`.

## Minimum quality gate to start with

- Run unit tests on every PR.
- Require booking and auth test suites to pass.
- Target **80%+ coverage on `server/utils/auth.ts`, `server/api/handleBooking.post.ts`, and `server/api/cancelBooking.post.ts`** first; broaden later.
