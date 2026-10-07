# Milestone 4 — Account Deletion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A member can delete their own account from the account page, on the website and in the iOS app, which removes their personal data while keeping anonymous booking and credit history.

**Architecture:** One server function anonymises the student row in place and removes everything personal in a single atomic batch; one authenticated endpoint calls it for the caller only. The client gets one `useAuth` action, a confirmation dialog component and a button in account details. No schema change.

**Tech Stack:** Nuxt 4, Nitro/h3, Drizzle (`neon-http`, `db.batch`), Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-06-ios-app-design.md` (section 5 and milestone 4 of section 7). Milestones 1–3 are merged and live.

## Global Constraints

- No database migration. Merging deploys to production automatically; nothing here may depend on a manual step.
- The account is anonymised in place, not hard-deleted: `credits.student_id` has no delete rule and the revenue report reads booking and credit history.
- After deletion the student row has: name `Verwijderd account`; email, password hash, phone and date of birth null; `archived` true; `emailVerified`, `reminders`, `pushNotifications`, `phoneRequested` false.
- Deleted outright: health details, sessions (all devices), passkeys, push subscriptions, login history, pending email codes.
- Kept, attached to the anonymous row: past bookings and all credit rows.
- Upcoming bookings are removed (spots freed), including inside the 24-hour window; their credits are released first so no foreign key blocks the delete. Unused credits are forfeited (they stay as rows on the anonymous account).
- The email address is freed: the same person can register again as a new account.
- All of it happens atomically: either everything or nothing.
- An admin account cannot delete itself. The endpoint only ever deletes the caller's own account.
- The confirmation word is `VERWIJDER`, typed by the user; the server checks it too.
- Dutch UI text, verbatim: button `Account verwijderen`; dialog title `Account verwijderen`; confirm button `Account definitief verwijderen`; cancel button `Annuleer`; input label `Typ VERWIJDER om te bevestigen`.
- The same component serves the website and the iOS app.
- DRY: no copied code. Tests are written before the code they cover. Run `yarn test:unit` before deleting or moving existing code.
- Work on branch `feature/account-deletion` (created from `origin/master`).

## Review Focus

1. A member with an upcoming booking that used a credit must be deletable: the credit is released before the booking row is removed, otherwise the foreign key from `credits.booking_id` blocks it — unit test in Task 1 and a real-database e2e in Task 4.
2. An admin must not be able to delete their own account, and nobody can delete someone else's — tests in Task 3.
3. After deletion the old password no longer logs in and the same email address can register again — e2e in Task 4.
4. Sessions on other devices stop working immediately — unit test in Task 1 (all session rows removed).
5. A failure half-way must leave the account untouched — Task 1 verifies that the batch is transactional.

## File Structure

| File | Responsibility |
|---|---|
| `shared/account.ts` (new) | The confirmation word, shared by client and server |
| `server/utils/accountDeletion.ts` (new) | Anonymises one account atomically; reports what was removed |
| `server/utils/emailTemplates.ts` | Two new emails: to the member, to the studio |
| `server/utils/constants.ts` | Sender and studio addresses in one place |
| `server/api/auth/delete-account.post.ts` (new) | The endpoint: who may, confirmation, emails, session |
| `app/composables/useAuth.ts` | `deleteAccount` action |
| `app/components/AccountDeleteDialog.vue` (new) | Consequences and typed confirmation |
| `app/components/AccountDetails.vue` | The button |
| `app/pages/privacy.vue` | Says how to delete an account |

---

### Task 1: Anonymise an account atomically

**Files:**
- Create: `server/utils/accountDeletion.ts`, `server/utils/accountDeletion.test.ts`
- Modify: `server/test-utils/index.ts`

**Interfaces:**
- Produces: `DELETED_ACCOUNT_NAME = 'Verwijderd account'`; `type DeletedAccount = { name: string; email: string | null; cancelledLessons: { type: string | null; teacher: string | null; date: Date }[]; unusedCredits: number }`; `deleteAccount(studentId: string): Promise<DeletedAccount | null>` (null when the student does not exist).

- [ ] **Step 1: Confirm the batch is a transaction**

Read how `drizzle-orm`'s Neon HTTP driver implements `batch` (`node_modules/drizzle-orm/neon-http/session.js` or `.cjs`): it must send all queries through the Neon client's `transaction(...)`, which is all-or-nothing. Quote the relevant lines in your report. If `batch` is NOT transactional in the installed version, stop and report BLOCKED: the design depends on it.

- [ ] **Step 2: Give the test database double a `batch`**

In `server/test-utils/index.ts`, in the object `createQueuedDb` returns, add after `delete: vi.fn(() => deleter),`:

```ts
        // Like drizzle's neon-http batch: runs the given queries together and resolves when all are done
        batch: vi.fn((queries: any[]) => Promise.all(queries)),
```

- [ ] **Step 3: Write the failing tests**

Create `server/utils/accountDeletion.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueuedDb } from '../test-utils'
import { deleteAccount, DELETED_ACCOUNT_NAME } from './accountDeletion'

const student = { name: 'Bea de Vries', email: 'bea@example.test' }
const upcoming = [
  { bookingId: 'booking_1', type: 'hatha yoga', teacher: null, date: new Date('2030-01-06T09:45:00.000Z') },
  { bookingId: 'booking_2', type: 'guest lesson', teacher: 'Bo Bol', date: new Date('2030-01-13T09:45:00.000Z') },
]
const unusedCredits = [{ id: 'credit_1' }, { id: 'credit_2' }, { id: 'credit_3' }]

const useDb = (results: any[][]) => {
  const db = createQueuedDb(results)
  vi.stubGlobal('db', db)
  return db
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('deleteAccount', () => {
  it('returns null and changes nothing for an unknown student', async () => {
    const db = useDb([[]])

    await expect(deleteAccount('nobody')).resolves.toBeNull()
    expect(db.batch).not.toHaveBeenCalled()
  })

  it('reports who was deleted, which lessons were cancelled and how many credits were unused', async () => {
    useDb([[student], upcoming, unusedCredits])

    await expect(deleteAccount('student_1')).resolves.toEqual({
      name: 'Bea de Vries',
      email: 'bea@example.test',
      cancelledLessons: [
        { type: 'hatha yoga', teacher: null, date: new Date('2030-01-06T09:45:00.000Z') },
        { type: 'guest lesson', teacher: 'Bo Bol', date: new Date('2030-01-13T09:45:00.000Z') },
      ],
      unusedCredits: 3,
    })
  })

  it('wipes the personal fields on the student row and archives it', async () => {
    const db = useDb([[student], [], []])
    await deleteAccount('student_1')

    expect(db.updater.set).toHaveBeenCalledWith({
      name: DELETED_ACCOUNT_NAME,
      email: null,
      passwordHash: null,
      phone: null,
      dateOfBirth: null,
      archived: true,
      emailVerified: false,
      reminders: false,
      pushNotifications: false,
      phoneRequested: false,
    })
  })

  it('does everything in one atomic batch', async () => {
    const db = useDb([[student], upcoming, unusedCredits])
    await deleteAccount('student_1')

    expect(db.batch).toHaveBeenCalledTimes(1)
  })

  it('removes health, sessions, passkeys, push subscriptions, login history and email codes', async () => {
    const db = useDb([[student], [], []])
    await deleteAccount('student_1')

    // six personal tables, no bookings to remove
    expect(db.delete).toHaveBeenCalledTimes(6)
  })

  it('releases the credits of upcoming bookings before removing those bookings', async () => {
    const db = useDb([[student], upcoming, []])
    await deleteAccount('student_1')

    // credits released + the student row
    expect(db.update).toHaveBeenCalledTimes(2)
    expect(db.updater.set).toHaveBeenCalledWith({ bookingId: null, usedAt: null })
    // six personal tables + the upcoming bookings
    expect(db.delete).toHaveBeenCalledTimes(7)

    const [queries] = db.batch.mock.calls[0]
    expect(queries).toHaveLength(9)
    // order matters for the foreign key from credits to bookings
    const releaseOrder = db.update.mock.invocationCallOrder[0]
    const firstDeleteOrder = db.delete.mock.invocationCallOrder[0]
    expect(releaseOrder).toBeLessThan(firstDeleteOrder)
  })

  it('leaves past bookings and credit rows alone when there is nothing upcoming', async () => {
    const db = useDb([[student], [], unusedCredits])
    await deleteAccount('student_1')

    // only the student row is updated: no credit is touched
    expect(db.update).toHaveBeenCalledTimes(1)
    expect(db.updater.set).not.toHaveBeenCalledWith({ bookingId: null, usedAt: null })
  })
})
```

Run: `yarn vitest run server/utils/accountDeletion.test.ts`
Expected: FAIL — cannot resolve `./accountDeletion`.

- [ ] **Step 4: Implement**

Create `server/utils/accountDeletion.ts`:

```ts
import { and, eq, gt, inArray, isNull } from 'drizzle-orm'
import { bookings, credits, health, lessons, loginHistory, otpCodes, passkeyCredentials, pushSubscriptions, sessions, students } from '../database/schema'

export const DELETED_ACCOUNT_NAME = 'Verwijderd account'

export type DeletedAccount = {
    name: string
    email: string | null
    cancelledLessons: { type: string | null; teacher: string | null; date: Date }[]
    unusedCredits: number
}

/**
 * Deletes a member's account by anonymising it in place.
 *
 * The student row stays, stripped of everything personal, so past bookings and credit history
 * (which the revenue report reads, and which `credits.student_id` requires) remain as anonymous records.
 * Everything else that is personal is removed, upcoming bookings are cancelled, and it all happens
 * in one atomic batch. Returns what the caller needs for the confirmation emails, or null if there is no such student.
 */
export async function deleteAccount(studentId: string): Promise<DeletedAccount | null> {
    const [student] = await db
        .select({ name: students.name, email: students.email })
        .from(students)
        .where(eq(students.id, studentId))
        .limit(1)
    if (!student) return null

    const now = new Date()
    const upcoming = await db
        .select({ bookingId: bookings.id, type: lessons.type, teacher: lessons.teacher, date: lessons.date })
        .from(bookings)
        .innerJoin(lessons, eq(bookings.lessonId, lessons.id))
        .where(and(eq(bookings.studentId, studentId), gt(lessons.date, now)))
    const unused = await db
        .select({ id: credits.id })
        .from(credits)
        .where(and(eq(credits.studentId, studentId), isNull(credits.bookingId), gt(credits.validTo, now)))

    const upcomingBookingIds = upcoming.map((booking) => booking.bookingId)
    const queries = [
        // A credit points at the booking it paid for, so it is released before that booking can go
        ...(upcomingBookingIds.length > 0
            ? [
                db.update(credits).set({ bookingId: null, usedAt: null }).where(inArray(credits.bookingId, upcomingBookingIds)),
                db.delete(bookings).where(inArray(bookings.id, upcomingBookingIds)),
            ]
            : []),
        db.delete(health).where(eq(health.studentId, studentId)),
        db.delete(sessions).where(eq(sessions.userId, studentId)),
        db.delete(passkeyCredentials).where(eq(passkeyCredentials.studentId, studentId)),
        db.delete(pushSubscriptions).where(eq(pushSubscriptions.studentId, studentId)),
        db.delete(loginHistory).where(eq(loginHistory.studentId, studentId)),
        db.delete(otpCodes).where(eq(otpCodes.userId, studentId)),
        db.update(students)
            .set({
                name: DELETED_ACCOUNT_NAME,
                email: null,
                passwordHash: null,
                phone: null,
                dateOfBirth: null,
                archived: true,
                emailVerified: false,
                reminders: false,
                pushNotifications: false,
                phoneRequested: false,
            })
            .where(eq(students.id, studentId)),
    ]
    // All or nothing: the Neon HTTP driver runs a batch as one transaction
    await db.batch(queries as [typeof queries[number], ...typeof queries])

    return {
        name: student.name,
        email: student.email,
        cancelledLessons: upcoming.map(({ type, teacher, date }) => ({ type, teacher, date })),
        unusedCredits: unused.length,
    }
}
```

If TypeScript rejects the `db.batch` argument's type, cast in the smallest way that compiles and keep the runtime behaviour; say what you did.

Run: `yarn vitest run server/utils/accountDeletion.test.ts`
Expected: 7 passed.

- [ ] **Step 5: Run the whole unit suite and commit**

Run: `yarn test:unit` — expected: all pass (the `batch` addition to the test double affects no existing test).

```bash
git add server/utils/accountDeletion.ts server/utils/accountDeletion.test.ts server/test-utils/index.ts
git commit -m "Anonymise an account in place in one atomic batch"
```

---

### Task 2: The two emails

**Files:**
- Modify: `server/utils/emailTemplates.ts`, `server/utils/constants.ts`, `server/utils/bookingNotifications.ts`
- Create: `server/utils/emailTemplates.test.ts` (if it does not exist; otherwise add to it)

**Interfaces:**
- Produces: `accountDeletedEmail(data: { name: string })` and `accountDeletedAdminEmail(data: { name: string; email: string | null; cancelledLessons: string[]; unusedCredits: number })`, each returning `{ subject: string; html: string; text: string }`; constants `MAIL_FROM = 'Yoga Ravennah <info@ravennah.com>'` and `STUDIO_EMAIL = 'info@ravennah.com'` in `server/utils/constants.ts`.

- [ ] **Step 1: One place for the two addresses**

Run `yarn test:unit` first (expected: all pass).

In `server/utils/constants.ts` add:

```ts
/** Sender of every transactional email. */
export const MAIL_FROM = 'Yoga Ravennah <info@ravennah.com>'
/** Where the studio receives its own notices. */
export const STUDIO_EMAIL = 'info@ravennah.com'
```

In `server/utils/bookingNotifications.ts` remove the two local constants `FROM` and `ADMIN_EMAIL`, import `MAIL_FROM` and `STUDIO_EMAIL` from `./constants`, and use them where `FROM` and `ADMIN_EMAIL` were used. Its tests must pass unchanged.

- [ ] **Step 2: Write the failing tests**

In `server/utils/emailTemplates.test.ts` (create it, importing from `./emailTemplates`):

```ts
import { describe, expect, it } from 'vitest'
import { accountDeletedAdminEmail, accountDeletedEmail } from './emailTemplates'

describe('accountDeletedEmail', () => {
  const mail = accountDeletedEmail({ name: 'Bea <b>' })

  it('confirms the deletion to the member', () => {
    expect(mail.subject).toBe('Je account is verwijderd')
    expect(mail.text).toContain('Hoi Bea <b>,')
    expect(mail.text).toContain('Je persoonsgegevens zijn gewist en je komende boekingen zijn geannuleerd.')
    expect(mail.text).toContain('info@ravennah.com')
  })

  it('escapes the name in the HTML version', () => {
    expect(mail.html).toContain('Bea &lt;b&gt;')
    expect(mail.html).not.toContain('Bea <b>')
  })
})

describe('accountDeletedAdminEmail', () => {
  it('tells the studio who left, which lessons were freed and how many credits were unused', () => {
    const mail = accountDeletedAdminEmail({
      name: 'Bea de Vries',
      email: 'bea@example.test',
      cancelledLessons: ['Hatha Yoga — zondag 6 januari van 9.45 tot 10.45 uur'],
      unusedCredits: 3,
    })

    expect(mail.subject).toBe('Account verwijderd: Bea de Vries')
    expect(mail.text).toContain('Leerling: Bea de Vries')
    expect(mail.text).toContain('E-mail: bea@example.test')
    expect(mail.text).toContain('Ongebruikte credits: 3')
    expect(mail.text).toContain('Hatha Yoga — zondag 6 januari van 9.45 tot 10.45 uur')
  })

  it('says so when there was nothing to cancel and no email address', () => {
    const mail = accountDeletedAdminEmail({ name: 'Walk-in', email: null, cancelledLessons: [], unusedCredits: 0 })

    expect(mail.text).toContain('E-mail: onbekend')
    expect(mail.text).toContain('Geannuleerde lessen: geen')
  })
})
```

Run: `yarn vitest run server/utils/emailTemplates.test.ts`
Expected: FAIL — the two functions are not exported.

- [ ] **Step 3: Implement**

Read `server/utils/emailTemplates.ts` first: use its existing helpers (`wrapInLayout`, `heading`, `subtext`, `infoTable`, `infoRow`, `escapeHtml`) the way `cancellationStudentEmail` and `cancellationAdminEmail` do, and check whether `infoRow` escapes its value itself (escape before passing only if it does not). Add at the end of the file:

```ts
// ─── Account deleted: email to STUDENT ────────────────────────────────────────

export function accountDeletedEmail(data: { name: string }): { subject: string; html: string; text: string } {
    const safeName = escapeHtml(data.name)
    const content = `
    ${heading('Je account is verwijderd')}
    ${subtext(`Hoi ${safeName}, je account bij Yoga Ravennah is verwijderd.`)}
    <p style="font-size:14px;color:#374151;text-align:center;margin:20px 0;">Je persoonsgegevens zijn gewist en je komende boekingen zijn geannuleerd. Wil je later weer meedoen, dan kun je altijd een nieuw account aanmaken.</p>
    <p style="font-size:13px;color:#9ca3af;text-align:center;margin-top:24px;">Heb je dit niet zelf gedaan? Neem dan contact op via info@ravennah.com.</p>`

    return {
        subject: 'Je account is verwijderd',
        html: wrapInLayout('Account verwijderd', content),
        text: `Hoi ${data.name},\n\nJe account bij Yoga Ravennah is verwijderd.\n\nJe persoonsgegevens zijn gewist en je komende boekingen zijn geannuleerd. Wil je later weer meedoen, dan kun je altijd een nieuw account aanmaken.\n\nHeb je dit niet zelf gedaan? Neem dan contact op via info@ravennah.com.\n\nYoga Ravennah`,
    }
}

// ─── Account deleted: email to ADMIN (info@ravennah.com) ──────────────────────

export function accountDeletedAdminEmail(data: {
    name: string
    email: string | null
    cancelledLessons: string[]
    unusedCredits: number
}): { subject: string; html: string; text: string } {
    const email = data.email ?? 'onbekend'
    const lessons = data.cancelledLessons.length > 0 ? data.cancelledLessons.join('; ') : 'geen'
    const content = `
    ${heading('Account verwijderd')}
    ${subtext(`${escapeHtml(data.name)} heeft het eigen account verwijderd.`)}
    ${infoTable(
        infoRow('Leerling', data.name) +
        infoRow('E-mail', email) +
        infoRow('Ongebruikte credits', String(data.unusedCredits)) +
        infoRow('Geannuleerde lessen', lessons)
    )}`

    return {
        subject: `Account verwijderd: ${data.name}`,
        html: wrapInLayout('Account verwijderd', content),
        text: `Account verwijderd\n\nLeerling: ${data.name}\nE-mail: ${email}\nOngebruikte credits: ${data.unusedCredits}\nGeannuleerde lessen: ${lessons}`,
    }
}
```

Run: `yarn vitest run server/utils/emailTemplates.test.ts` — expected: 4 passed.
Run: `yarn test:unit` — expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add server/utils/emailTemplates.ts server/utils/emailTemplates.test.ts server/utils/constants.ts server/utils/bookingNotifications.ts
git commit -m "Add the account-deleted emails and share the sender addresses"
```

---

### Task 3: The endpoint

**Files:**
- Create: `shared/account.ts`, `server/api/auth/delete-account.post.ts`, `server/api/auth/delete-account.post.test.ts`
- Modify: `server/test-setup.ts` (only if the new globals need stubbing for other tests)

**Interfaces:**
- Consumes: `deleteAccount`, `DeletedAccount` (Task 1); `accountDeletedEmail`, `accountDeletedAdminEmail`, `MAIL_FROM`, `STUDIO_EMAIL` (Task 2); `lessonTypeLabel` from `shared/lesson`; `formatLessonDate` from `server/utils/dates`.
- Produces: `DELETE_ACCOUNT_CONFIRMATION = 'VERWIJDER'` in `shared/account.ts`; `POST /api/auth/delete-account` with body `{ confirmation: string }` → `{ success: true }`; 400 for a wrong confirmation, 401 when not logged in, 403 for an admin.

- [ ] **Step 1: The shared confirmation word**

Create `shared/account.ts`:

```ts
/** The word a member types to confirm deleting their account. Checked in the dialog and again on the server. */
export const DELETE_ACCOUNT_CONFIRMATION = 'VERWIJDER'
```

- [ ] **Step 2: Write the failing tests**

Create `server/api/auth/delete-account.post.test.ts`. Import the handler's collaborators explicitly in the handler (Step 3), and mock those modules here:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ deleteAccount: vi.fn() }))
vi.mock('../../utils/accountDeletion', () => ({ deleteAccount: mocks.deleteAccount }))

import handler from './delete-account.post'

const handle = handler as unknown as (event: any) => Promise<any>
const waited: Promise<unknown>[] = []
const event = { waitUntil: (promise: Promise<unknown>) => { waited.push(promise) } } as any

const asCaller = (user: { $id: string; labels: string[] }) =>
  vi.stubGlobal('requireAuth', vi.fn().mockResolvedValue({ email: 'x@test.nl', name: 'X', ...user }))
const withBody = (body: unknown) => vi.stubGlobal('readBody', vi.fn().mockResolvedValue(body))

beforeEach(() => {
  waited.length = 0
  mocks.deleteAccount.mockReset().mockResolvedValue({
    name: 'Bea de Vries',
    email: 'bea@example.test',
    cancelledLessons: [{ type: 'hatha yoga', teacher: null, date: new Date('2030-01-06T09:45:00.000Z') }],
    unusedCredits: 2,
  })
  vi.stubGlobal('destroySession', vi.fn().mockResolvedValue(undefined))
  vi.stubGlobal('smtpTransport', { sendMail: vi.fn().mockResolvedValue({}) })
  asCaller({ $id: 'student_1', labels: [] })
  withBody({ confirmation: 'VERWIJDER' })
})

describe('POST /api/auth/delete-account', () => {
  it("deletes the caller's own account and ends the session", async () => {
    await expect(handle(event)).resolves.toEqual({ success: true })

    expect(mocks.deleteAccount).toHaveBeenCalledWith('student_1')
    expect(destroySession).toHaveBeenCalledWith(event)
  })

  it('ignores any account id in the request: only the caller can be deleted', async () => {
    withBody({ confirmation: 'VERWIJDER', studentId: 'someone_else', userId: 'someone_else' })

    await handle(event)

    expect(mocks.deleteAccount).toHaveBeenCalledTimes(1)
    expect(mocks.deleteAccount).toHaveBeenCalledWith('student_1')
  })

  it('refuses an admin', async () => {
    asCaller({ $id: 'admin_1', labels: ['admin'] })

    await expect(handle(event)).rejects.toMatchObject({ statusCode: 403 })
    expect(mocks.deleteAccount).not.toHaveBeenCalled()
  })

  it.each([undefined, {}, { confirmation: 'verwijder' }, { confirmation: 'VERWIJDER ' }, { confirmation: 'ja' }])(
    'refuses without the exact confirmation word (%j)',
    async (body) => {
      withBody(body)

      await expect(handle(event)).rejects.toMatchObject({ statusCode: 400 })
      expect(mocks.deleteAccount).not.toHaveBeenCalled()
    },
  )

  it('emails the member at the address the account had, and the studio', async () => {
    await handle(event)
    await Promise.all(waited)

    const sent = (smtpTransport.sendMail as any).mock.calls.map(([mail]: any[]) => mail)
    expect(sent).toHaveLength(2)
    expect(sent.find((mail: any) => mail.to === 'bea@example.test')?.subject).toBe('Je account is verwijderd')
    const studio = sent.find((mail: any) => mail.to === 'info@ravennah.com')
    expect(studio?.subject).toBe('Account verwijderd: Bea de Vries')
    expect(studio?.text).toContain('Hatha Yoga')
    expect(studio?.text).toContain('Ongebruikte credits: 2')
  })

  it('emails only the studio when the account had no email address', async () => {
    mocks.deleteAccount.mockResolvedValue({ name: 'Walk-in', email: null, cancelledLessons: [], unusedCredits: 0 })

    await handle(event)
    await Promise.all(waited)

    const sent = (smtpTransport.sendMail as any).mock.calls.map(([mail]: any[]) => mail)
    expect(sent.map((mail: any) => mail.to)).toEqual(['info@ravennah.com'])
  })

  it('still succeeds when an email cannot be sent', async () => {
    vi.stubGlobal('smtpTransport', { sendMail: vi.fn().mockRejectedValue(new Error('smtp down')) })
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(handle(event)).resolves.toEqual({ success: true })
    await Promise.all(waited)

    expect(logged).toHaveBeenCalled()
  })

  it('answers 404 when the account no longer exists', async () => {
    mocks.deleteAccount.mockResolvedValue(null)

    await expect(handle(event)).rejects.toMatchObject({ statusCode: 404 })
  })
})
```

Run: `yarn vitest run server/api/auth/delete-account.post.test.ts`
Expected: FAIL — cannot resolve `./delete-account.post`.

- [ ] **Step 3: Implement**

Create `server/api/auth/delete-account.post.ts`:

```ts
import { createError } from 'h3'
import { DELETE_ACCOUNT_CONFIRMATION } from '../../../shared/account'
import { lessonTypeLabel } from '../../../shared/lesson'
import { deleteAccount, type DeletedAccount } from '../../utils/accountDeletion'
import { MAIL_FROM, STUDIO_EMAIL } from '../../utils/constants'
import { formatLessonDate } from '../../utils/dates'
import { accountDeletedAdminEmail, accountDeletedEmail } from '../../utils/emailTemplates'

/** Confirms to the member (at the address the account had) and tells the studio. Never throws. */
async function sendDeletionEmails(account: DeletedAccount): Promise<void> {
    const mails = [
        ...(account.email ? [{ to: account.email, ...accountDeletedEmail({ name: account.name }) }] : []),
        {
            to: STUDIO_EMAIL,
            ...accountDeletedAdminEmail({
                name: account.name,
                email: account.email,
                cancelledLessons: account.cancelledLessons.map((lesson) => `${lessonTypeLabel(lesson)} — ${formatLessonDate(lesson.date)}`),
                unusedCredits: account.unusedCredits,
            }),
        },
    ]
    await Promise.allSettled(mails.map(async (mail) => {
        try {
            await smtpTransport.sendMail({ from: MAIL_FROM, to: mail.to, subject: mail.subject, html: mail.html, text: mail.text })
        } catch (err: any) {
            console.error('[DeleteAccount] Email failed:', err?.message ?? err)
        }
    }))
}

/**
 * POST /api/auth/delete-account
 * A member deletes their own account. Only ever acts on the caller; an admin account cannot delete itself.
 */
export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)

    if (user.labels.includes('admin')) {
        throw createError({ statusCode: 403, statusMessage: 'Een beheerdersaccount kan niet worden verwijderd' })
    }

    const body = await readBody(event)
    if (body?.confirmation !== DELETE_ACCOUNT_CONFIRMATION) {
        throw createError({ statusCode: 400, statusMessage: `Typ ${DELETE_ACCOUNT_CONFIRMATION} om te bevestigen` })
    }

    const account = await deleteAccount(user.$id)
    if (!account) {
        throw createError({ statusCode: 404, statusMessage: 'Account niet gevonden' })
    }

    // The session rows are gone with the account; this also clears the website's cookie
    await destroySession(event)

    event.waitUntil(sendDeletionEmails(account))

    return { success: true }
})
```

Run: `yarn vitest run server/api/auth/delete-account.post.test.ts` — expected: 12 passed.

If `formatLessonDate` or `createError` behave differently under the test setup than the tests assume (they are real imports here, not the stubbed globals), adjust the test's mocks minimally, keep what each test asserts, and say what you changed.

- [ ] **Step 4: Run the whole unit suite and commit**

Run: `yarn test:unit` — expected: all pass.

```bash
git add shared/account.ts server/api/auth/delete-account.post.ts server/api/auth/delete-account.post.test.ts
git commit -m "Add the endpoint a member uses to delete their own account"
```

---

### Task 4: The button, the dialog and the end-to-end proof

**Files:**
- Create: `app/components/AccountDeleteDialog.vue`
- Modify: `app/composables/useAuth.ts`, `app/utils/apiHooks.ts`, `app/utils/apiHooks.test.ts`, `app/components/AccountDetails.vue`, `e2e/registration.spec.ts`, `e2e/app-mode.spec.ts`

**Interfaces:**
- Consumes: `POST /api/auth/delete-account` and `DELETE_ACCOUNT_CONFIRMATION` (Task 3).
- Produces: `useAuth().deleteAccount(confirmation: string): Promise<void>`; component `<AccountDeleteDialog :credits="number" @close="..." />`.

- [ ] **Step 1: The app forgets its token after a deletion — failing test**

In `app/utils/apiHooks.test.ts` add:

```ts
  it('clears the token after the account was deleted', async () => {
    await hooks.onResponse({ request: `${API_BASE}/api/auth/delete-account`, response: response(200) } as any)

    expect(store.value).toBeNull()
  })

  it('keeps the token when deleting the account was refused', async () => {
    await hooks.onResponse({ request: `${API_BASE}/api/auth/delete-account`, response: response(400) } as any)

    expect(store.value).toBe('stored-token')
  })
```

Run: `yarn vitest run app/utils/apiHooks.test.ts` — expected: the first new test FAILS.

In `app/utils/apiHooks.ts`, in `onResponse`, extend the condition that clears the token so it also covers a successful deletion. Replace

```ts
      } else if (path === '/api/auth/logout' || (path === '/api/auth/me' && response.status === 401 && new Headers(options?.headers).has('authorization'))) {
```

with

```ts
      } else if (
        path === '/api/auth/logout'
        || (path === '/api/auth/delete-account' && response.ok)
        || (path === '/api/auth/me' && response.status === 401 && new Headers(options?.headers).has('authorization'))
      ) {
```

Run: `yarn vitest run app/utils/apiHooks.test.ts` — expected: all pass.

- [ ] **Step 2: The `useAuth` action**

In `app/composables/useAuth.ts`, `logout` currently ends with two lines that reset the client's state. Give that reset a name and use it twice. Replace

```ts
  async function logout() {
    // While still logged in: this phone stops receiving the account's notifications
    if (useNativeApp().isNativeApp) await forgetPushDevice()
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    clearNuxtData(['my-credits', 'my-bookings', 'admin-users', 'admin-lessons', 'lessons', 'credit-summary'])
  }
```

with

```ts
  /** Nobody is logged in any more: forget the user and everything fetched for them. */
  function clearSessionState() {
    user.value = null
    clearNuxtData(['my-credits', 'my-bookings', 'admin-users', 'admin-lessons', 'lessons', 'credit-summary'])
  }

  async function logout() {
    // While still logged in: this phone stops receiving the account's notifications
    if (useNativeApp().isNativeApp) await forgetPushDevice()
    await $fetch('/api/auth/logout', { method: 'POST' })
    clearSessionState()
  }

  /** Deletes the logged-in member's own account. `confirmation` is the word the member typed. */
  async function deleteAccount(confirmation: string) {
    if (useNativeApp().isNativeApp) await forgetPushDevice()
    await $fetch('/api/auth/delete-account', { method: 'POST', body: { confirmation } })
    clearSessionState()
  }
```

and add `deleteAccount` to the object the composable returns.

- [ ] **Step 3: Write the failing end-to-end test**

In `e2e/registration.spec.ts`, add the import `import { bookFirstAvailableLesson, openAccountTab } from './helpers'` (merge it with the file's existing import from `./helpers`), and add this test inside the `test.describe('Registration flow', ...)` block:

```ts
    test('a member can delete their own account, and the email address is free again', async ({ page }) => {
        const user = generateTestUser()
        await register(page, user)
        await page.waitForURL('**/account', { timeout: 20_000 })

        // An upcoming booking that used the welcome credit: deleting must cope with it
        await bookFirstAvailableLesson(page)
        await page.locator('.fixed.inset-0').first().click({ position: { x: 10, y: 10 } })
        await expect(page.locator('.fixed.inset-0')).not.toBeVisible()

        await openAccountTab(page, 'Instellingen')
        await page.getByRole('button', { name: 'Account verwijderen', exact: true }).click()

        const dialog = page.getByRole('dialog', { name: 'Account verwijderen' })
        await expect(dialog).toBeVisible()
        await expect(dialog.getByText('Je komende boekingen worden geannuleerd.')).toBeVisible()

        // The confirm button only works once the word is typed
        const confirm = dialog.getByRole('button', { name: 'Account definitief verwijderen' })
        await expect(confirm).toBeDisabled()
        await dialog.getByLabel('Typ VERWIJDER om te bevestigen').fill('VERWIJDER')
        await expect(confirm).toBeEnabled()
        await confirm.click()

        // Logged out, back on the home page
        await page.waitForURL((url) => url.pathname === '/', { timeout: 15_000 })
        await expect(page.locator('nav').getByRole('link', { name: 'Login' })).toBeVisible({ timeout: 10_000 })

        // The old password no longer works
        await page.goto('/login')
        const otherOptions = page.getByRole('button', { name: 'Andere manier gebruiken' })
        const usePassword = page.getByRole('button', { name: 'Wachtwoord gebruiken' })
        await expect(otherOptions.or(usePassword).first()).toBeVisible({ timeout: 30_000 })
        if (await otherOptions.isVisible()) await otherOptions.click()
        await usePassword.click()
        await page.fill('#email', user.email)
        await page.fill('#password', user.password)
        await page.getByRole('button', { name: 'Inloggen', exact: true }).click()
        await expect(page.getByText(/Verkeerde e-mailadres of wachtwoord|Maak eerst een account aan/)).toBeVisible({ timeout: 10_000 })

        // The same address can register again as a new account
        await register(page, user)
        await page.waitForURL('**/account', { timeout: 20_000 })
        await expect(page.getByRole('link', { name: user.fullName })).toBeVisible({ timeout: 10_000 })
    })
```

Read `e2e/helpers.ts` and the existing tests in this file first. If the login page's exact error text for an unknown account differs from the pattern above, use the text the page really shows (read `app/pages/login.vue` and `server/api/auth/login.post.ts`) and say so. If the passkey-first login steps already exist as a helper that can be used without expecting a successful login, use it instead of repeating them.

Run: `yarn test:e2e:branch e2e/registration.spec.ts`
Expected: the new test FAILS at the "Account verwijderen" button, which does not exist yet.

- [ ] **Step 4: The dialog**

Read `app/components/AccountDetails.vue` in full first. Its edit dialogs (for example the one titled "Medische info bewerken") are custom overlays: follow their markup and classes for the backdrop and the card so the new dialog looks like them, and note that the e2e helpers close such a dialog by clicking the backdrop (`.fixed.inset-0`).

Create `app/components/AccountDeleteDialog.vue` with:
- `<script setup lang="ts">`: `const props = defineProps<{ credits: number }>()`, `const emit = defineEmits<{ close: [] }>()`, `const { deleteAccount } = useAuth()`, `const { call, error, pending } = useApiCall()`, `const toast = useToast()`, `const typed = ref('')`, `import { DELETE_ACCOUNT_CONFIRMATION } from '~~/shared/account'`, `const confirmed = computed(() => typed.value === DELETE_ACCOUNT_CONFIRMATION)`.
- A `remove()` function: returns early unless `confirmed`; `await call(() => deleteAccount(typed.value))`; if `error.value` is set, stay open (the error is shown in the dialog); otherwise `toast.add({ title: 'Je account is verwijderd', color: 'primary' })` and `await navigateTo('/')`.
- The overlay root with `role="dialog"`, `aria-modal="true"` and `aria-labelledby` pointing at the title's id, so it is announced and the e2e test can find it by its name. Clicking the backdrop (not the card) and pressing Escape emit `close`, unless `pending` is true.
- Content, in this order, with these exact Dutch texts:
  - Title (the `aria-labelledby` target): `Account verwijderen`
  - A list:
    - `Je naam, e-mailadres, telefoonnummer, geboortedatum en medische info worden gewist.`
    - `Je komende boekingen worden geannuleerd.`
    - Only when `credits > 0`: `Je verliest 1 ongebruikte credit.` for one, `Je verliest {n} ongebruikte credits.` for more.
    - `Je eerdere boekingen blijven zonder je naam bewaard voor onze administratie.`
  - A line in the error colour: `Dit kan niet ongedaan worden gemaakt.`
  - A text input with a real `<label>` reading `Typ VERWIJDER om te bevestigen` (build the label from the constant, not a second literal), `autocomplete="off"`, `autocapitalize="characters"`, bound to `typed`.
  - When `error` is set: the error text, in the style the edit dialogs use for errors.
  - Two buttons: `Account definitief verwijderen` (`color="error"`, `:disabled="!confirmed"`, `:loading="pending"`, calls `remove`) and `Annuleer` (`color="primary" variant="outline"`, emits `close`, disabled while `pending`).

Keep the component to this; no other features.

- [ ] **Step 5: The button**

In `app/components/AccountDetails.vue`:

1. In `<script setup>`, near the other computed values, add:

```ts
// A member can delete their own account; an admin cannot, and nobody can do it for someone else from here
const canDeleteAccount = computed(() => !props.user && !isAdmin.value)
const showDeleteDialog = ref(false)
```

2. In the template, directly after the privacy paragraph

```html
      <p class="mt-4 text-xs text-gray-500">
        Lees in onze
        <nuxt-link to="/privacy" class="underline underline-offset-2 hover:text-emerald-400 transition-colors">privacyverklaring</nuxt-link>
        hoe we met je gegevens omgaan.
      </p>
```

add

```html
      <div v-if="canDeleteAccount" class="mt-6 pt-4 border-t border-gray-800/50">
        <UButton color="error" variant="ghost" size="sm" icon="i-lucide-trash-2" @click="showDeleteDialog = true">Account verwijderen</UButton>
      </div>
```

3. At the end of the template's root element (where the other dialogs are rendered), add:

```html
    <AccountDeleteDialog v-if="showDeleteDialog" :credits="myCredits" @close="showDeleteDialog = false" />
```

`myCredits` is already declared in this component (`useCredits().availableCredits`). Check what `props.credits` is used for; if the component shows the viewed user's credits through it, still pass `myCredits` here, because the dialog only ever opens for the logged-in member's own account.

- [ ] **Step 6: See the end-to-end test pass**

Run: `yarn test:e2e:branch e2e/registration.spec.ts`
Expected: 3 passed.

This run proves, on a real database, that an account with an upcoming booking and a used credit can be deleted (the foreign key from credits to bookings), that the old login stops working, and that the address is free again.

- [ ] **Step 7: The app shows the button to a member and not to an admin**

In `e2e/app-mode.spec.ts`:
- In the student test, at a point where the test is on `/account` and logged in (before it logs out), add:

```ts
    // A member can delete their own account from the app (required by the App Store)
    await openAccountTab(page, 'Instellingen')
    await expect(page.getByRole('button', { name: 'Account verwijderen', exact: true })).toBeVisible({ timeout: 10_000 })
```

- In the admin test, while on the account page's settings tab (open it with `openAccountTab(page, 'Instellingen')` if the test is not already there), add:

```ts
    await expect(page.getByRole('button', { name: 'Account verwijderen', exact: true })).toHaveCount(0)
```

Import `openAccountTab` from `./helpers` if the file does not already. Make sure each addition leaves the test on the tab the following steps expect; if a later step needs another tab, switch back.

- [ ] **Step 8: Verify everything and commit**

Run: `yarn test:unit` — expected: all pass.
Run: `yarn test:e2e:branch` — expected: all website specs pass (12 tests).
Run: `yarn test:e2e:branch --app` — expected: 2 passed.

```bash
git add app/components/AccountDeleteDialog.vue app/components/AccountDetails.vue app/composables/useAuth.ts app/utils/apiHooks.ts app/utils/apiHooks.test.ts e2e/registration.spec.ts e2e/app-mode.spec.ts
git commit -m "Let a member delete their own account from the account page"
```

---

### Task 5: Privacy page and documentation

**Files:**
- Modify: `app/pages/privacy.vue`, `CLAUDE.md`

- [ ] **Step 1: Say how to delete an account**

In `app/pages/privacy.vue`:

1. Change `Laatst bijgewerkt: 6 oktober 2026` to `Laatst bijgewerkt: 7 oktober 2026`.

2. In the section headed `Je gegevens laten verwijderen`, replace the paragraph's text so the section reads (keep the existing `mailto` link markup and the `privacyEmail` variable for the address):

> Je kunt je account zelf verwijderen: log in, ga naar je account en kies onder Instellingen "Account verwijderen". Je persoonsgegevens worden dan direct gewist en je komende boekingen geannuleerd. Lukt dat niet, stuur dan een e-mail naar info@ravennah.com; we verwijderen je gegevens dan binnen 30 dagen. Gegevens over boekingen en credits bewaren we zonder je naam of andere persoonsgegevens voor onze administratie.

The section heading stays `Je gegevens laten verwijderen` (the e2e test in `e2e/privacy.spec.ts` looks for it).

- [ ] **Step 2: Document**

In `CLAUDE.md`, directly after the `### Booking Flow (Server-Side)` section's list, add a section:

```markdown
### Account Deletion

A member deletes their own account with `POST /api/auth/delete-account` (button in `AccountDetails.vue`, dialog `AccountDeleteDialog.vue`). `server/utils/accountDeletion.ts` anonymises the student row in place (name "Verwijderd account", personal fields null, archived) and removes health details, sessions, passkeys, push subscriptions, login history and email codes in one `db.batch`, which the Neon HTTP driver runs as a transaction. Upcoming bookings are removed after their credits are released; past bookings and credit rows stay for the revenue report. Admin accounts cannot delete themselves. When a table or `students` column holding personal data is added, add it to that function.
```

- [ ] **Step 3: Verify and commit**

Run: `yarn test:e2e:branch e2e/privacy.spec.ts` — expected: 2 passed.

```bash
git add app/pages/privacy.vue CLAUDE.md
git commit -m "Describe self-service account deletion in the privacy statement and the docs"
```

---

## Release steps for the owner

No database change: merging is safe at any time and deploys the website with the new button.

1. Merge the pull request.
2. On the live site, check with a throwaway account: register, delete the account from Instellingen, confirm the two emails arrive (member and studio), and that the account shows as "Verwijderd account" and archived in the admin user list.
3. The next TestFlight build contains the button automatically (same component).

## Self-review notes

- Spec section 5: anonymise in place (Task 1), what is wiped, deleted and kept (Task 1), upcoming bookings cancelled and credits forfeited (Task 1), email freed (Task 4 e2e), button and typed confirmation with the credit count (Task 4), one endpoint that signs the user out (Task 3), confirmation email and studio notice (Tasks 2–3), admins refused (Task 3), privacy text (Task 5).
- Spec says "one transaction": done with `db.batch`, verified in Task 1 Step 1.
- Not in this milestone: an admin deleting someone else's account, restoring a deleted account, exporting personal data.
