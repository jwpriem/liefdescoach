# iOS App Milestone 2 — Push Notifications — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The iOS app receives the studio's existing notifications (lesson reminders, booking changes, credits empty) as native pushes with action buttons, and app sessions can no longer be forged from a website cookie.

**Architecture:** `push_subscriptions` gains a `platform` column so one table holds web-push subscriptions and APNs device tokens; `server/utils/push.ts` dispatches per row to web push or a new APNs sender while its two public functions keep their signatures. The app registers its device token through the existing subscribe endpoint. Notification categories and action ids live in one shared TypeScript module that server and client import; the same ids are registered in `AppDelegate.swift`. `sessions` gains a `kind` column so a session is only valid on the path (cookie or bearer) it was created for.

**Tech Stack:** Nuxt 4, Nitro/h3, Drizzle + Neon, Vitest, Playwright, Capacitor 8, `@capacitor/push-notifications`, `apns2`, Swift (AppDelegate).

**Spec:** `docs/superpowers/specs/2026-10-06-ios-app-design.md` (section 3, the badge item of section 4, and milestone 2 of section 7). Milestone 1 is merged.

## Global Constraints

- The website's behaviour must not change: web push keeps working exactly as today, and cookie sessions keep working.
- **Deploy order:** the migration must be applied to production BEFORE this code is deployed. The new code selects `sessions.kind` and `push_subscriptions.platform`; without them every authenticated request fails. The migration is additive and safe under the old code.
- Never touch the production database from a task. Dry runs use a throwaway Neon branch of `seed`; applying to production is the owner's own step.
- Do not use `drizzle-kit migrate`: the database's `drizzle.__drizzle_migrations` table is out of sync with `drizzle/meta/_journal.json` (it records only 0004), so it would try to re-run 0005.
- Never adjust a migration that already ran (`drizzle/0000`–`0005`).
- Bundle ID / APNs topic: `com.ravennah.app`.
- Category ids, verbatim: `LESSON_REMINDER`, `BOOKING_CHANGE`, `CREDITS_EMPTY`. Action ids, verbatim: `ROUTE`, `VIEW_LESSON`, `VIEW_PARTICIPANTS`, `ADD_CREDITS`.
- Button titles (Dutch), verbatim: `Route`, `Bekijk les`, `Bekijk deelnemers`, `Credits toevoegen`.
- Every push sets the app badge to 1; opening the app clears it.
- All action buttons open the app at a destination; none do background work.
- Permission is requested at the first opening of the app, and again after the first successful booking if it is still undecided. (Changed by the owner during execution; the plan originally said "never at launch".) The device is registered with the server only once a user is logged in.
- APNs credentials come from environment variables only; never commit a key.
- DRY: no copied code. Tests are written before the code they cover. Run `yarn test:unit` before deleting or moving existing code.
- Work on a new branch `feature/ios-push` created from `origin/master`.

## Additions beyond the spec

Two items were carried over from milestone 1's final review and are part of this plan:

- **Session kind** (Task 2): closes the gap where a website cookie replayed with the app's Origin was accepted as an app session.
- **Keychain store hardening** (Task 8): a temporary Keychain error no longer looks like a logout.

## Review Focus

1. Two accounts on one phone: when user B subscribes with a device token that user A registered, the row must move to B so A's notifications stop arriving there — test in Task 5.
2. APNs not configured (local dev, e2e): sending must be skipped without throwing and without deleting any token — tests in Tasks 3 and 4.
3. A token Apple rejects as invalid must be removed, but a transient failure must leave it in place — test in Task 4.
4. A tap on an action whose data is missing (no address, no student id) must still land on a sensible page — test in Task 3.
5. A user who switched notifications off in the app must not be silently re-registered at the next launch — test in Task 6.

## File Structure

| File | Responsibility |
|---|---|
| `server/database/schema.ts` | `push_subscriptions.platform`, nullable web-push keys, `sessions.kind` |
| `drizzle/0006_ios_push.sql` (generated) | The migration |
| `scripts/migrate-0006-ios-push.ts` (new) | Dry run on a throwaway branch, or apply to a given database |
| `server/utils/auth-session.ts` | Sessions are bound to the path they were created for |
| `shared/push.ts` (new) | Categories, action ids, payload type, tap destinations |
| `server/utils/apns.ts` (new) | Sends one notification to one iPhone |
| `server/utils/pushMessages.ts` (new) | Builds the three notifications |
| `server/utils/push.ts` | Dispatches per subscription to web push or APNs |
| `server/api/push/subscribe.post.ts`, `unsubscribe.post.ts` | Accept iOS device tokens |
| `app/utils/nativePushDevice.ts` (new) | This device's permission, registration and preference |
| `app/composables/usePushNotifications.ts` | Web or native implementation behind one interface |
| `app/plugins/native-push.client.ts` (new) | Keeps the device registered; routes notification taps |
| `app/utils/sessionTokenStore.ts` | Keychain errors are not cached as "logged out" |
| `ios/App/App/AppDelegate.swift`, `App.entitlements` | Token forwarding, categories, badge, push capability |

---

### Task 1: Migration with dry run

**Files:**
- Modify: `server/database/schema.ts`
- Create: `drizzle/0006_ios_push.sql` and `drizzle/meta/0006_snapshot.json` (generated), `scripts/migrate-0006-ios-push.ts`

**Interfaces:**
- Produces: columns `push_subscriptions.platform` (`text`, not null, default `'web'`), `push_subscriptions.p256dh` and `.auth` nullable, `sessions.kind` (`text`, not null, default `'web'`). Drizzle fields `pushSubscriptions.platform`, `sessions.kind`.

- [ ] **Step 1: Change the schema**

In `server/database/schema.ts`, in the `sessions` table, directly after the `tokenHash` line add:

```ts
  kind: text('kind').notNull().default('web'), // 'web' (cookie) or 'app' (bearer token); a session is only valid on its own path
```

In the `pushSubscriptions` table replace

```ts
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
```

with

```ts
  platform: text('platform').notNull().default('web'), // 'web' (Web Push) or 'ios' (APNs)
  endpoint: text('endpoint').notNull(), // Web Push endpoint URL, or the APNs device token for iOS
  p256dh: text('p256dh'), // Web Push only
  auth: text('auth'), // Web Push only
```

- [ ] **Step 2: Generate the migration**

Run: `yarn drizzle-kit generate --name ios_push`
Expected: creates `drizzle/0006_ios_push.sql` with exactly these four statements (order may differ), plus a snapshot and a journal entry:

```sql
ALTER TABLE "push_subscriptions" ALTER COLUMN "p256dh" DROP NOT NULL;
ALTER TABLE "push_subscriptions" ALTER COLUMN "auth" DROP NOT NULL;
ALTER TABLE "push_subscriptions" ADD COLUMN "platform" text DEFAULT 'web' NOT NULL;
ALTER TABLE "sessions" ADD COLUMN "kind" text DEFAULT 'web' NOT NULL;
```

If the file contains anything else (a dropped column, a changed table), stop and report: the snapshot is out of date and the owner must decide.

- [ ] **Step 3: Write the migration script**

Create `scripts/migrate-0006-ios-push.ts`:

```ts
/**
 * Migration 0006: iOS push tokens and session kind.
 *
 * Usage:
 *   tsx --tsconfig scripts/tsconfig.json scripts/migrate-0006-ios-push.ts --dry-run
 *       Applies the migration to a throwaway Neon branch of `seed` and prints the evidence.
 *       Needs NEON_API_KEY and NEON_PROJECT_ID in .env.
 *
 *   NUXT_DATABASE_URL=... tsx --tsconfig scripts/tsconfig.json scripts/migrate-0006-ios-push.ts --yes
 *       Applies the migration to that database. Safe to run twice.
 *
 * `drizzle-kit migrate` is not used: the database's migration table is out of sync with the journal.
 */

import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'
import { neonClientFromEnv, assertNotProductionUrl, waitForDatabase } from './lib/neon'

const statements = readFileSync('drizzle/0006_ios_push.sql', 'utf-8')
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean)

const COLUMNS = `
    select table_name, column_name, data_type, is_nullable, column_default
    from information_schema.columns
    where (table_name = 'push_subscriptions' and column_name in ('platform', 'p256dh', 'auth'))
       or (table_name = 'sessions' and column_name = 'kind')
    order by table_name, column_name`

async function migrate(url: string): Promise<void> {
    const sql = neon(url)
    console.log('\nColumns before:')
    console.table(await sql.query(COLUMNS))

    const added = (await sql.query(`${COLUMNS}`) as { column_name: string }[])
        .filter((c) => c.column_name === 'platform' || c.column_name === 'kind').length
    if (added === 2) {
        console.log('Already applied — nothing to do.')
        return
    }
    if (added === 1) throw new Error('Half applied: one of platform/kind exists. Inspect the database by hand.')

    for (const statement of statements) {
        console.log(`Running: ${statement}`)
        await sql.query(statement)
    }

    console.log('\nColumns after:')
    console.table(await sql.query(COLUMNS))
}

async function dryRun(): Promise<void> {
    const client = neonClientFromEnv()
    const seed = (await client.listBranches()).find((b) => b.name === 'seed')
    if (!seed) throw new Error('No seed branch. Create it first: yarn db:refresh-seed --yes')

    const created = await client.createBranch(`migration-0006-dryrun-${Date.now()}`, seed.id)
    console.log(`Dry run on throwaway branch ${created.branch.name}`)
    try {
        assertNotProductionUrl(created.connectionUri, await client.productionHosts())
        const sql = neon(created.connectionUri)
        await waitForDatabase(() => sql`select 1`)

        // The seed wipes both tables, so add one old-shape row each to prove existing rows survive
        const [student] = await sql.query('select id from students limit 1') as { id: string }[]
        await sql.query(`insert into sessions (id, user_id, token_hash, expires_at) values ('dryrun-session', $1, 'dryrun-hash', now() + interval '1 day')`, [student.id])
        await sql.query(`insert into push_subscriptions (id, student_id, endpoint, p256dh, auth) values ('dryrun-web', $1, 'https://dryrun.example/endpoint', 'key', 'auth')`, [student.id])

        await migrate(created.connectionUri)

        // A new-shape row: an iOS token without web-push keys
        await sql.query(`insert into push_subscriptions (id, student_id, platform, endpoint) values ('dryrun-ios', $1, 'ios', 'abcdef0123456789')`, [student.id])

        console.log('\nExisting session after the migration:')
        console.table(await sql.query(`select id, kind from sessions where id = 'dryrun-session'`))
        console.log('Push subscriptions after the migration (old web row, new iOS row):')
        console.table(await sql.query(`select id, platform, endpoint, p256dh, auth from push_subscriptions where id like 'dryrun-%' order by id`))
    } finally {
        console.log(`\nDeleting branch ${created.branch.name}`)
        await client.deleteBranch(created.branch)
    }
}

async function main(): Promise<void> {
    console.log('Statements in drizzle/0006_ios_push.sql:')
    for (const statement of statements) console.log(`  ${statement}`)

    if (process.argv.includes('--dry-run')) return dryRun()

    const url = process.env.NUXT_DATABASE_URL
    if (!url || !process.argv.includes('--yes')) {
        throw new Error('To apply: NUXT_DATABASE_URL=... and --yes. To rehearse: --dry-run.')
    }
    console.log(`\nApplying to ${new URL(url).host}`)
    await migrate(url)
}

main().catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
})
```

- [ ] **Step 4: Run the dry run**

Run: `tsx --tsconfig scripts/tsconfig.json scripts/migrate-0006-ios-push.ts --dry-run`

Expected:
- "Columns before" lists `p256dh` and `auth` with `is_nullable = NO` and no `platform` or `kind`.
- Four "Running:" lines.
- "Columns after" lists `platform` (`NO`, default `'web'::text`), `kind` (`NO`, default `'web'::text`), and `p256dh`/`auth` with `is_nullable = YES`.
- The existing session has `kind = web`; `dryrun-web` has `platform = web` with its keys; `dryrun-ios` has `platform = ios` and null keys.
- "Deleting branch migration-0006-dryrun-…".

Paste the complete output into your report.

- [ ] **Step 5: Run the unit suite**

Run: `yarn test:unit`
Expected: all pass (the anonymiser tests accept the change: both tables are classified `wipe`).

- [ ] **Step 6: Commit**

```bash
git add server/database/schema.ts drizzle scripts/migrate-0006-ios-push.ts
git commit -m "Add migration 0006: iOS push tokens and session kind"
```

- [ ] **Step 7: STOP — owner approval of the dry run**

Report DONE with the dry-run output. Do not apply the migration anywhere. The project rule is that dry-run evidence is presented to the owner before proceeding.

- [ ] **Step 8: After approval — apply to the non-production branches (controller or owner)**

The e2e runner branches from `seed`, and local development uses `dev`; both need the new columns before any later task can run its e2e checks.

```bash
NUXT_DATABASE_URL="$(yarn -s db:branch-url seed)" tsx --tsconfig scripts/tsconfig.json scripts/migrate-0006-ios-push.ts --yes
NUXT_DATABASE_URL="$(yarn -s db:branch-url dev)" tsx --tsconfig scripts/tsconfig.json scripts/migrate-0006-ios-push.ts --yes
```

Expected for each: four "Running:" lines and the "Columns after" table. If `db:branch-url` refuses `seed`, stop and report rather than working around it.

Then: `yarn test:e2e:branch`
Expected: 6 passed (the old code runs unchanged on the migrated schema).

---

### Task 2: Sessions are bound to the path they were created for

**Files:**
- Modify: `server/utils/auth-session.ts`, `server/utils/auth-session.test.ts`

**Interfaces:**
- Consumes: `sessions.kind` (Task 1).
- Produces: `createSession` stores `kind: 'app'` for app requests and `'web'` otherwise; `getSessionUser` returns null when the session's kind does not match the request's path. Signatures unchanged.

- [ ] **Step 1: Write the failing tests**

In `server/utils/auth-session.test.ts`, replace the `sessionRow` helper with:

```ts
const sessionRow = (expiresInDays: number, createdDaysAgo: number | null = 1) => ({
  sessionId: 'session_1',
  userId: 'user_1',
  expiresAt: new Date(Date.now() + expiresInDays * DAY),
  createdAt: createdDaysAgo === null ? null : new Date(Date.now() - createdDaysAgo * DAY),
  // Read when the code checks it, so a row matches the path of the test that uses it
  get kind() { return testState.headers.get('origin') === 'capacitor://localhost' ? 'app' : 'web' },
  name: 'Test',
  email: 'test@example.test',
  isAdmin: false,
})
```

Add inside `describe('createSession', ...)`:

```ts
  it('stores the kind of path the session was created on', async () => {
    const web = useDb()
    await createSession(event, 'user_1')
    expect(web.inserter.values).toHaveBeenCalledWith(expect.objectContaining({ kind: 'web' }))

    const app = useDb()
    fromApp()
    await createSession(event, 'user_1')
    expect(app.inserter.values).toHaveBeenCalledWith(expect.objectContaining({ kind: 'app' }))
  })
```

Add inside `describe('getSessionUser', ...)`:

```ts
  it('rejects a website session presented as an app token', async () => {
    const db = useDb([[{ ...sessionRow(10), kind: 'web' }]])
    fromApp()
    testState.headers.set('authorization', 'Bearer stolen-cookie-value')

    await expect(getSessionUser(event)).resolves.toBeNull()
    expect(db.update).not.toHaveBeenCalled()
  })

  it('rejects an app session presented as a website cookie', async () => {
    useDb([[{ ...sessionRow(10), kind: 'app' }]])
    testState.cookies.set('rav_session', 'app-token-value')

    await expect(getSessionUser(event)).resolves.toBeNull()
  })
```

- [ ] **Step 2: Run them and see the three new tests fail**

Run: `yarn vitest run server/utils/auth-session.test.ts`
Expected: the three new tests FAIL; every existing test passes.

- [ ] **Step 3: Implement**

In `server/utils/auth-session.ts`:

1. Directly below `readSessionToken` add:

```ts
/** A session is only valid on the path it was created for, so a leaked cookie cannot become an app token. */
function sessionKind(event: H3Event): 'app' | 'web' {
  return isNativeAppRequest(event) ? 'app' : 'web'
}
```

2. In `createSession`, in the `db.insert(sessions).values({...})` object, after `tokenHash,` add:

```ts
    kind: sessionKind(event),
```

3. In `getSessionUser`, in the `.select({...})` object, after `createdAt: sessions.createdAt,` add:

```ts
      kind: sessions.kind,
```

4. In `getSessionUser`, replace

```ts
  const session = result[0]
```

with

```ts
  const session = result[0]
  if (session.kind !== sessionKind(event)) return null
```

- [ ] **Step 4: Run the tests and see them pass**

Run: `yarn vitest run server/utils/auth-session.test.ts`
Expected: all pass.

- [ ] **Step 5: Check both login paths end to end**

Run: `yarn test:unit` — expected: all pass.
Run: `yarn test:e2e:branch` — expected: 6 passed.
Run: `yarn test:e2e:branch --app` — expected: 1 passed.

(These need Task 1 Step 8 done. If login fails with a database error about a missing column, the migration was not applied to `seed`: stop and report.)

- [ ] **Step 6: Commit**

```bash
git add server/utils/auth-session.ts server/utils/auth-session.test.ts
git commit -m "Bind sessions to the path they were created for"
```

---

### Task 3: Shared push contract and the APNs sender

**Files:**
- Create: `shared/push.ts`, `shared/push.test.ts`, `server/utils/apns.ts`, `server/utils/apns.test.ts`
- Modify: `vitest.config.ts`, `nuxt.config.ts`, `package.json` (dependency), `CLAUDE.md`

**Interfaces:**
- Produces from `shared/push.ts`: `PUSH_CATEGORY`, `PUSH_ACTION`, `type PushCategory`, `type PushPayload = { title: string; body: string; url?: string; category?: PushCategory; address?: string; studentId?: string }`, `type PushTapData = { url?: string; address?: string; studentId?: string }`, `pushDestination(actionId: string, data: PushTapData): { path: string } | { maps: string }`.
- Produces from `server/utils/apns.ts`: `type PushOutcome = 'sent' | 'invalid-token' | 'failed'`, `sendApns(deviceToken: string, payload: PushPayload): Promise<PushOutcome>`.
- Produces runtime config: `apnsKey`, `apnsKeyId`, `apnsTeamId`, `apnsBundleId`, `apnsProduction`.

- [ ] **Step 1: Install the APNs library and check its API**

```bash
yarn add apns2
```

Open `node_modules/apns2/README.md` and confirm these shapes, which Step 6 uses:
- `new ApnsClient({ team, keyId, signingKey, defaultTopic, host })`
- `new Notification(deviceToken, { alert: { title, body }, badge, sound, category, data })`
- `client.send(notification)` rejects with an error that has a `reason` string such as `BadDeviceToken` or `Unregistered`.

If a shape differs, stop and report what the README says.

- [ ] **Step 2: Let Vitest find tests in `shared/`**

In `vitest.config.ts`, add `'shared/**/*.test.ts'` to the `include` array.

- [ ] **Step 3: Write the failing tests for the shared contract**

Create `shared/push.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { PUSH_ACTION, pushDestination } from './push'

describe('pushDestination', () => {
  it('opens the notification url on a plain tap', () => {
    expect(pushDestination('tap', { url: '/lessen' })).toEqual({ path: '/lessen' })
  })

  it('falls back to the account page when a tap carries no url', () => {
    expect(pushDestination('tap', {})).toEqual({ path: '/account' })
  })

  it('opens Maps with the lesson address for Route', () => {
    expect(pushDestination(PUSH_ACTION.route, { address: 'Emmy van Leersumhof 24a, 3059 LT Rotterdam', url: '/lessen' }))
      .toEqual({ maps: 'Emmy van Leersumhof 24a, 3059 LT Rotterdam' })
  })

  it('shows the lessons instead when Route has no address', () => {
    expect(pushDestination(PUSH_ACTION.route, { url: '/lessen' })).toEqual({ path: '/lessen' })
  })

  it('opens the lesson list for Bekijk les', () => {
    expect(pushDestination(PUSH_ACTION.viewLesson, {})).toEqual({ path: '/lessen' })
  })

  it('opens the admin lessons tab for Bekijk deelnemers', () => {
    expect(pushDestination(PUSH_ACTION.viewParticipants, {})).toEqual({ path: '/account?tab=admin-lessen' })
  })

  it('opens the student for Credits toevoegen', () => {
    expect(pushDestination(PUSH_ACTION.addCredits, { studentId: 'student_1' })).toEqual({ path: '/admin/users/student_1' })
  })

  it('opens the user list when Credits toevoegen has no student id', () => {
    expect(pushDestination(PUSH_ACTION.addCredits, {})).toEqual({ path: '/account?tab=gebruikers' })
  })

  it('treats an unknown action like a plain tap', () => {
    expect(pushDestination('SOMETHING_ELSE', { url: '/account' })).toEqual({ path: '/account' })
  })
})
```

Run: `yarn vitest run shared/push.test.ts`
Expected: FAIL — cannot resolve `./push`.

- [ ] **Step 4: Implement the shared contract**

Create `shared/push.ts`:

```ts
/**
 * Push notification contract shared by the server (which sends) and the iOS app (which reacts to taps).
 * The same category and action ids are registered natively in ios/App/App/AppDelegate.swift.
 */

export const PUSH_CATEGORY = {
  lessonReminder: 'LESSON_REMINDER',
  bookingChange: 'BOOKING_CHANGE',
  creditsEmpty: 'CREDITS_EMPTY',
} as const

export const PUSH_ACTION = {
  route: 'ROUTE',
  viewLesson: 'VIEW_LESSON',
  viewParticipants: 'VIEW_PARTICIPANTS',
  addCredits: 'ADD_CREDITS',
} as const

export type PushCategory = typeof PUSH_CATEGORY[keyof typeof PUSH_CATEGORY]

/** What a tap needs to know to pick a destination. */
export type PushTapData = { url?: string; address?: string; studentId?: string }

export type PushPayload = PushTapData & { title: string; body: string; category?: PushCategory }

/** Where a tap on a notification or one of its buttons leads: an in-app path, or an address for Maps. */
export function pushDestination(actionId: string, data: PushTapData): { path: string } | { maps: string } {
  const fallback = { path: data.url ?? '/account' }

  switch (actionId) {
    case PUSH_ACTION.route:
      return data.address ? { maps: data.address } : fallback
    case PUSH_ACTION.viewLesson:
      return { path: '/lessen' }
    case PUSH_ACTION.viewParticipants:
      return { path: '/account?tab=admin-lessen' }
    case PUSH_ACTION.addCredits:
      return { path: data.studentId ? `/admin/users/${data.studentId}` : '/account?tab=gebruikers' }
    default:
      return fallback
  }
}
```

Run: `yarn vitest run shared/push.test.ts`
Expected: 9 passed.

- [ ] **Step 5: Write the failing tests for the APNs sender**

Create `server/utils/apns.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const apns = vi.hoisted(() => ({
  clientOptions: [] as any[],
  send: vi.fn(),
}))

vi.mock('apns2', () => ({
  ApnsClient: class {
    constructor(options: any) { apns.clientOptions.push(options) }
    send = apns.send
  },
  Notification: class {
    constructor(public deviceToken: string, public options: any) {}
  },
}))

const CONFIGURED = {
  apnsKey: '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----',
  apnsKeyId: 'KEYID12345',
  apnsTeamId: 'TEAMID1234',
  apnsBundleId: 'com.ravennah.app',
  apnsProduction: false,
  public: {},
}

async function loadSender(config: Record<string, unknown>) {
  vi.resetModules()
  vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue(config))
  return (await import('./apns')).sendApns
}

beforeEach(() => {
  apns.clientOptions.length = 0
  apns.send.mockReset()
  apns.send.mockResolvedValue(undefined)
})

describe('sendApns', () => {
  it('does nothing and reports failure when APNs is not configured', async () => {
    const sendApns = await loadSender({ ...CONFIGURED, apnsKey: '' })

    await expect(sendApns('token', { title: 'T', body: 'B' })).resolves.toBe('failed')
    expect(apns.send).not.toHaveBeenCalled()
  })

  it('connects to the sandbox with the configured key, restoring its line breaks', async () => {
    const sendApns = await loadSender(CONFIGURED)
    await sendApns('token', { title: 'T', body: 'B' })

    expect(apns.clientOptions[0]).toMatchObject({
      team: 'TEAMID1234',
      keyId: 'KEYID12345',
      defaultTopic: 'com.ravennah.app',
      host: 'api.sandbox.push.apple.com',
      signingKey: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----',
    })
  })

  it('connects to production when configured', async () => {
    const sendApns = await loadSender({ ...CONFIGURED, apnsProduction: true })
    await sendApns('token', { title: 'T', body: 'B' })

    expect(apns.clientOptions[0].host).toBe('api.push.apple.com')
  })

  it('sends title, body, badge, category and tap data', async () => {
    const sendApns = await loadSender(CONFIGURED)
    const outcome = await sendApns('device-token', {
      title: 'Morgen yoga!',
      body: 'Je hebt morgen Hatha Yoga — tot dan!',
      url: '/lessen',
      category: 'LESSON_REMINDER',
      address: 'Emmy van Leersumhof 24a, 3059 LT Rotterdam',
    })

    expect(outcome).toBe('sent')
    const notification = apns.send.mock.calls[0][0]
    expect(notification.deviceToken).toBe('device-token')
    expect(notification.options).toEqual({
      alert: { title: 'Morgen yoga!', body: 'Je hebt morgen Hatha Yoga — tot dan!' },
      badge: 1,
      sound: 'default',
      category: 'LESSON_REMINDER',
      data: { url: '/lessen', address: 'Emmy van Leersumhof 24a, 3059 LT Rotterdam' },
    })
  })

  it.each(['BadDeviceToken', 'Unregistered', 'DeviceTokenNotForTopic'])('reports %s as an invalid token', async (reason) => {
    const sendApns = await loadSender(CONFIGURED)
    apns.send.mockRejectedValue({ reason })

    await expect(sendApns('token', { title: 'T', body: 'B' })).resolves.toBe('invalid-token')
  })

  it('reports any other error as a failure, not an invalid token', async () => {
    const sendApns = await loadSender(CONFIGURED)
    apns.send.mockRejectedValue({ reason: 'TooManyRequests' })

    await expect(sendApns('token', { title: 'T', body: 'B' })).resolves.toBe('failed')
  })

  it('reuses one client across sends', async () => {
    const sendApns = await loadSender(CONFIGURED)
    await sendApns('a', { title: 'T', body: 'B' })
    await sendApns('b', { title: 'T', body: 'B' })

    expect(apns.clientOptions).toHaveLength(1)
  })
})
```

Run: `yarn vitest run server/utils/apns.test.ts`
Expected: FAIL — cannot resolve `./apns`.

- [ ] **Step 6: Implement the APNs sender**

Create `server/utils/apns.ts`:

```ts
import { ApnsClient, Notification } from 'apns2'
import type { PushPayload } from '../../shared/push'

export type PushOutcome = 'sent' | 'invalid-token' | 'failed'

// Apple's answers that mean this device token will never work again for this app
const INVALID_TOKEN_REASONS = new Set(['BadDeviceToken', 'Unregistered', 'DeviceTokenNotForTopic'])

let client: ApnsClient | null | undefined

/** One connection for the lifetime of the server; null when APNs is not configured (local dev, tests). */
function getClient(): ApnsClient | null {
  if (client !== undefined) return client

  const { apnsKey, apnsKeyId, apnsTeamId, apnsBundleId, apnsProduction } = useRuntimeConfig()
  client = apnsKey && apnsKeyId && apnsTeamId && apnsBundleId
    ? new ApnsClient({
        team: apnsTeamId,
        keyId: apnsKeyId,
        // The .p8 key is stored in one env line with \n for its line breaks
        signingKey: apnsKey.replace(/\\n/g, '\n'),
        defaultTopic: apnsBundleId,
        host: apnsProduction ? 'api.push.apple.com' : 'api.sandbox.push.apple.com',
      })
    : null
  return client
}

/** Sends one notification to one iPhone. Never throws. */
export async function sendApns(deviceToken: string, payload: PushPayload): Promise<PushOutcome> {
  const apns = getClient()
  if (!apns) return 'failed'

  const { title, body, category, ...data } = payload
  try {
    await apns.send(new Notification(deviceToken, {
      alert: { title, body },
      badge: 1,
      sound: 'default',
      ...(category ? { category } : {}),
      data,
    }))
    return 'sent'
  } catch (err: any) {
    if (INVALID_TOKEN_REASONS.has(err?.reason)) return 'invalid-token'
    console.error('[Push] APNs send failed:', err?.reason ?? err?.message ?? err)
    return 'failed'
  }
}
```

Run: `yarn vitest run server/utils/apns.test.ts`
Expected: 9 passed.

- [ ] **Step 7: Add the runtime config**

In `nuxt.config.ts`, in `runtimeConfig`, directly after the `vapidEmail` line add:

```ts
    apnsKey: '',               // NUXT_APNS_KEY (contents of the .p8 key, line breaks written as \n)
    apnsKeyId: '',             // NUXT_APNS_KEY_ID
    apnsTeamId: '',            // NUXT_APNS_TEAM_ID
    apnsBundleId: 'com.ravennah.app', // NUXT_APNS_BUNDLE_ID
    apnsProduction: false,     // NUXT_APNS_PRODUCTION (true on the live site: App Store and TestFlight builds)
```

In `CLAUDE.md`, in the `### Runtime Config` section, change the **Private** line so it ends with `, `apnsKey`, `apnsKeyId`, `apnsTeamId`, `apnsBundleId`, `apnsProduction``.

- [ ] **Step 8: Run the unit suite and commit**

Run: `yarn test:unit` — expected: all pass.

```bash
git add shared server/utils/apns.ts server/utils/apns.test.ts vitest.config.ts nuxt.config.ts package.json yarn.lock CLAUDE.md
git commit -m "Add the shared push contract and the APNs sender"
```

---

### Task 4: Deliver every notification to iPhones too

**Files:**
- Create: `server/utils/pushMessages.ts`, `server/utils/pushMessages.test.ts`, `server/utils/push.test.ts`
- Modify: `server/utils/push.ts`, `server/utils/bookingNotifications.ts`, `server/utils/bookingNotifications.test.ts`, `server/api/sendLessonReminders.post.ts`

**Interfaces:**
- Consumes: `PushPayload`, `PUSH_CATEGORY` from `shared/push` (Task 3); `sendApns`, `PushOutcome` from `./apns` (Task 3); `pushSubscriptions.platform` (Task 1).
- Produces: `lessonReminderPush(lessonType: string, address: string): PushPayload`, `bookingChangePush(kind: 'confirmation' | 'cancellation', studentName: string, lessonType: string, formattedDate: string): PushPayload`, `creditsEmptyPush(studentName: string, studentId: string): PushPayload`. `sendPushToStudent(studentId, payload)` and `sendPushToAdmins(payload)` keep their signatures and now reach iOS rows.

- [ ] **Step 1: Write the failing tests for the message builders**

Create `server/utils/pushMessages.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { bookingChangePush, creditsEmptyPush, lessonReminderPush } from './pushMessages'

describe('push messages', () => {
  it('builds the lesson reminder with the address for the Route button', () => {
    expect(lessonReminderPush('Hatha Yoga', 'Emmy van Leersumhof 24a, 3059 LT Rotterdam')).toEqual({
      title: 'Morgen yoga!',
      body: 'Je hebt morgen Hatha Yoga — tot dan!',
      url: '/lessen',
      category: 'LESSON_REMINDER',
      address: 'Emmy van Leersumhof 24a, 3059 LT Rotterdam',
    })
  })

  it('builds the booking confirmation for admins', () => {
    expect(bookingChangePush('confirmation', 'Bea', 'Hatha Yoga', 'zondag 11 oktober')).toEqual({
      title: 'Nieuwe boeking',
      body: 'Bea heeft Hatha Yoga geboekt op zondag 11 oktober',
      url: '/account',
      category: 'BOOKING_CHANGE',
    })
  })

  it('builds the cancellation for admins', () => {
    expect(bookingChangePush('cancellation', 'Bea', 'Hatha Yoga', 'zondag 11 oktober')).toMatchObject({
      title: 'Annulering',
      body: 'Bea heeft Hatha Yoga geannuleerd op zondag 11 oktober',
      category: 'BOOKING_CHANGE',
    })
  })

  it('builds the credits-empty notice with the student for the Credits toevoegen button', () => {
    expect(creditsEmptyPush('Bea', 'student_1')).toEqual({
      title: 'Credits op',
      body: 'Bea heeft geen credits meer',
      url: '/account',
      category: 'CREDITS_EMPTY',
      studentId: 'student_1',
    })
  })
})
```

Run: `yarn vitest run server/utils/pushMessages.test.ts`
Expected: FAIL — cannot resolve `./pushMessages`.

- [ ] **Step 2: Implement the builders**

Create `server/utils/pushMessages.ts`:

```ts
import { PUSH_CATEGORY, type PushPayload } from '../../shared/push'

/** The studio's notifications. Each carries the category whose buttons fit it and the data those buttons need. */

export function lessonReminderPush(lessonType: string, address: string): PushPayload {
  return {
    title: 'Morgen yoga!',
    body: `Je hebt morgen ${lessonType} — tot dan!`,
    url: '/lessen',
    category: PUSH_CATEGORY.lessonReminder,
    address,
  }
}

export function bookingChangePush(kind: 'confirmation' | 'cancellation', studentName: string, lessonType: string, formattedDate: string): PushPayload {
  const isConfirmation = kind === 'confirmation'
  return {
    title: isConfirmation ? 'Nieuwe boeking' : 'Annulering',
    body: `${studentName} heeft ${lessonType} ${isConfirmation ? 'geboekt' : 'geannuleerd'} op ${formattedDate}`,
    url: '/account',
    category: PUSH_CATEGORY.bookingChange,
  }
}

export function creditsEmptyPush(studentName: string, studentId: string): PushPayload {
  return {
    title: 'Credits op',
    body: `${studentName} heeft geen credits meer`,
    url: '/account',
    category: PUSH_CATEGORY.creditsEmpty,
    studentId,
  }
}
```

Run: `yarn vitest run server/utils/pushMessages.test.ts`
Expected: 4 passed.

- [ ] **Step 3: Write the failing tests for the dispatcher**

Create `server/utils/push.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueuedDb } from '../test-utils'

const mocks = vi.hoisted(() => ({
  webSend: vi.fn(),
  sendApns: vi.fn(),
}))

vi.mock('web-push', () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: mocks.webSend },
}))
vi.mock('./apns', () => ({ sendApns: mocks.sendApns }))

import { sendPushToStudent } from './push'

const payload = { title: 'T', body: 'B', url: '/account' }
const webRow = { id: 'sub_web', platform: 'web', endpoint: 'https://push.example/abc', p256dh: 'key', auth: 'auth' }
const iosRow = { id: 'sub_ios', platform: 'ios', endpoint: 'device-token', p256dh: null, auth: null }

const useDb = (rows: any[]) => {
  const db = createQueuedDb([rows])
  vi.stubGlobal('db', db)
  return db
}

beforeEach(() => {
  mocks.webSend.mockReset().mockResolvedValue(undefined)
  mocks.sendApns.mockReset().mockResolvedValue('sent')
  vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
    vapidPrivateKey: 'private',
    vapidEmail: 'mailto:info@ravennah.com',
    public: { vapidPublicKey: 'public' },
  }))
})

describe('sendPushToStudent', () => {
  it('sends web rows through Web Push and iOS rows through APNs', async () => {
    useDb([webRow, iosRow])

    await expect(sendPushToStudent('student_1', payload)).resolves.toBe(2)
    expect(mocks.webSend).toHaveBeenCalledWith(
      { endpoint: 'https://push.example/abc', keys: { p256dh: 'key', auth: 'auth' } },
      JSON.stringify(payload),
    )
    expect(mocks.sendApns).toHaveBeenCalledWith('device-token', payload)
  })

  it('removes an iPhone token Apple rejects as invalid', async () => {
    const db = useDb([iosRow])
    mocks.sendApns.mockResolvedValue('invalid-token')

    await expect(sendPushToStudent('student_1', payload)).resolves.toBe(0)
    expect(db.delete).toHaveBeenCalled()
  })

  it('keeps an iPhone token after a transient failure or when APNs is not configured', async () => {
    const db = useDb([iosRow])
    mocks.sendApns.mockResolvedValue('failed')

    await expect(sendPushToStudent('student_1', payload)).resolves.toBe(0)
    expect(db.delete).not.toHaveBeenCalled()
  })

  it('removes a web subscription that is gone', async () => {
    const db = useDb([webRow])
    mocks.webSend.mockRejectedValue({ statusCode: 410 })

    await expect(sendPushToStudent('student_1', payload)).resolves.toBe(0)
    expect(db.delete).toHaveBeenCalled()
  })

  it('keeps a web subscription after another error', async () => {
    const db = useDb([webRow])
    mocks.webSend.mockRejectedValue({ statusCode: 500, message: 'boom' })

    await expect(sendPushToStudent('student_1', payload)).resolves.toBe(0)
    expect(db.delete).not.toHaveBeenCalled()
  })

  it('still delivers to iPhones when Web Push is not configured', async () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({ vapidPrivateKey: '', public: { vapidPublicKey: '' } }))
    useDb([webRow, iosRow])

    await expect(sendPushToStudent('student_1', payload)).resolves.toBe(1)
    expect(mocks.webSend).not.toHaveBeenCalled()
    expect(mocks.sendApns).toHaveBeenCalled()
  })
})
```

Run: `yarn vitest run server/utils/push.test.ts`
Expected: FAIL — the iOS cases fail (APNs is never called).

- [ ] **Step 4: Make `push.ts` dispatch per platform**

In `server/utils/push.ts`:

1. Replace the imports and the local `PushPayload` type (the first lines of the file through the closing `}` of the type) with:

```ts
import webpush from 'web-push'
import { eq } from 'drizzle-orm'
import { pushSubscriptions, students } from '../database/schema'
import type { PushPayload } from '../../shared/push'
import { sendApns, type PushOutcome } from './apns'

type Subscription = { id: string; platform: string; endpoint: string; p256dh: string | null; auth: string | null }
```

2. Replace the whole `sendToSubscription` function (including its doc comment) with:

```ts
/** Sends through Web Push. Never throws. */
async function sendWebPush(sub: Subscription, payload: PushPayload): Promise<PushOutcome> {
    const vapid = getVapidConfig()
    if (!vapid || !sub.p256dh || !sub.auth) return 'failed'

    webpush.setVapidDetails(vapid.email, vapid.publicKey, vapid.privateKey)

    try {
        await webpush.sendNotification(
            {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify(payload)
        )
        return 'sent'
    } catch (err: any) {
        // 410 Gone or 404 = subscription expired
        if (err?.statusCode === 410 || err?.statusCode === 404) return 'invalid-token'
        console.error(`[Push] Failed to send to ${sub.endpoint}:`, err?.message ?? err)
        return 'failed'
    }
}

/**
 * Send a push notification to a single subscription: an iPhone through APNs, a browser through Web Push.
 * Returns true if sent; a subscription the push service no longer knows is cleaned up.
 */
async function sendToSubscription(sub: Subscription, payload: PushPayload): Promise<boolean> {
    const outcome = sub.platform === 'ios' ? await sendApns(sub.endpoint, payload) : await sendWebPush(sub, payload)

    if (outcome === 'invalid-token') {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id))
        console.log(`[Push] Removed expired subscription ${sub.id}`)
    }
    return outcome === 'sent'
}
```

`getVapidConfig`, `sendPushToStudent` and `sendPushToAdmins` stay as they are.

Run: `yarn vitest run server/utils/push.test.ts`
Expected: 6 passed.

- [ ] **Step 5: Use the builders at the call sites**

In `server/utils/bookingNotifications.ts`:

1. Add to the imports at the top of the file:

```ts
import { bookingChangePush, creditsEmptyPush } from './pushMessages'
```

2. Replace

```ts
    const pushes = [{
        title: isConfirmation ? 'Nieuwe boeking' : 'Annulering',
        body: `${student.name} heeft ${lessonType} ${isConfirmation ? 'geboekt' : 'geannuleerd'} op ${formattedDate}`,
        url: '/account',
    }]
    if (isConfirmation && !(await findAvailableCredit(studentId))) {
        pushes.push({ title: 'Credits op', body: `${student.name} heeft geen credits meer`, url: '/account' })
    }
```

with

```ts
    const pushes = [bookingChangePush(kind, student.name, lessonType, formattedDate)]
    if (isConfirmation && !(await findAvailableCredit(studentId))) {
        pushes.push(creditsEmptyPush(student.name, studentId))
    }
```

(`kind` is the function's first parameter, of type `BookingNotificationKind`; if that type is not exactly `'confirmation' | 'cancellation'`, stop and report.)

In `server/utils/bookingNotifications.test.ts`, change the two existing push assertions to also check the new fields:

```ts
        expect(sendPushToAdmins).toHaveBeenCalledWith(expect.objectContaining({ title: 'Nieuwe boeking', category: 'BOOKING_CHANGE' }))
```

```ts
        expect(sendPushToAdmins).toHaveBeenCalledWith(expect.objectContaining({ title: 'Credits op', category: 'CREDITS_EMPTY', studentId: expect.any(String) }))
```

In `server/api/sendLessonReminders.post.ts`:

1. Add to the imports at the top of the file:

```ts
import { lessonReminderPush } from '../utils/pushMessages'
```

2. Replace

```ts
                    const sent = await sendPushToStudent(student.studentId, {
                        title: 'Morgen yoga!',
                        body: `Je hebt morgen ${lessonType} — tot dan!`,
                        url: '/lessen',
                    })
```

with

```ts
                    const sent = await sendPushToStudent(student.studentId, lessonReminderPush(lessonType, address))
```

- [ ] **Step 6: Run the unit suite and commit**

Run: `yarn test:unit` — expected: all pass.

```bash
git add server/utils/push.ts server/utils/push.test.ts server/utils/pushMessages.ts server/utils/pushMessages.test.ts server/utils/bookingNotifications.ts server/utils/bookingNotifications.test.ts server/api/sendLessonReminders.post.ts
git commit -m "Deliver notifications to iPhones through APNs next to Web Push"
```

---

### Task 5: The subscribe endpoints accept iPhone tokens

**Files:**
- Modify: `server/api/push/subscribe.post.ts`, `server/api/push/unsubscribe.post.ts`
- Create: `server/api/push/subscribe.post.test.ts`, `server/api/push/unsubscribe.post.test.ts`

**Interfaces:**
- Consumes: `pushSubscriptions.platform` (Task 1).
- Produces: `POST /api/push/subscribe` accepts `{ platform: 'ios', token: string }` next to `{ endpoint, keys: { p256dh, auth } }`. `POST /api/push/unsubscribe` accepts `{ token: string }` next to `{ endpoint: string }`.

- [ ] **Step 1: Write the failing tests**

Create `server/api/push/subscribe.post.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './subscribe.post'
import { asUser, createQueuedDb } from '../../test-utils'

const handle = handler as unknown as (event: any) => Promise<any>
const IOS_TOKEN = 'a1b2c3d4'.repeat(8)

const useDb = (results: any[][] = []) => {
  const db = createQueuedDb(results)
  vi.stubGlobal('db', db)
  return db
}
const withBody = (body: unknown) => vi.stubGlobal('readBody', vi.fn().mockResolvedValue(body))

beforeEach(() => {
  vi.stubGlobal('requireAuth', vi.fn().mockResolvedValue({ $id: 'student_b', labels: [] }))
  vi.stubGlobal('generateId', vi.fn().mockReturnValue('new-id'))
  asUser('student_b')
})

describe('POST /api/push/subscribe', () => {
  it('stores an iPhone device token without web-push keys', async () => {
    const db = useDb([[]])
    withBody({ platform: 'ios', token: IOS_TOKEN })

    await expect(handle({})).resolves.toEqual({ success: true })
    expect(db.inserter.values).toHaveBeenCalledWith({
      id: 'new-id',
      studentId: 'student_b',
      platform: 'ios',
      endpoint: IOS_TOKEN,
      p256dh: null,
      auth: null,
    })
  })

  it('moves a device token to the user who now uses the phone', async () => {
    const db = useDb([[{ id: 'existing', studentId: 'student_a', endpoint: IOS_TOKEN }]])
    withBody({ platform: 'ios', token: IOS_TOKEN })

    await handle({})

    expect(db.insert).not.toHaveBeenCalled()
    expect(db.updater.set).toHaveBeenCalledWith(expect.objectContaining({ studentId: 'student_b', platform: 'ios' }))
  })

  it('rejects an iPhone token that is not a hex string', async () => {
    useDb([[]])
    withBody({ platform: 'ios', token: 'https://not-a-token' })

    await expect(handle({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('still stores a web subscription with its keys', async () => {
    const db = useDb([[]])
    withBody({ endpoint: 'https://push.example/abc', keys: { p256dh: 'key', auth: 'auth' } })

    await handle({})

    expect(db.inserter.values).toHaveBeenCalledWith({
      id: 'new-id',
      studentId: 'student_b',
      platform: 'web',
      endpoint: 'https://push.example/abc',
      p256dh: 'key',
      auth: 'auth',
    })
  })

  it('still rejects a web subscription without keys', async () => {
    useDb([[]])
    withBody({ endpoint: 'https://push.example/abc' })

    await expect(handle({})).rejects.toMatchObject({ statusCode: 400 })
  })
})
```

Create `server/api/push/unsubscribe.post.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './unsubscribe.post'
import { createQueuedDb } from '../../test-utils'

const handle = handler as unknown as (event: any) => Promise<any>

const useDb = (results: any[][] = []) => {
  const db = createQueuedDb(results)
  vi.stubGlobal('db', db)
  return db
}
const withBody = (body: unknown) => vi.stubGlobal('readBody', vi.fn().mockResolvedValue(body))

beforeEach(() => {
  vi.stubGlobal('requireAuth', vi.fn().mockResolvedValue({ $id: 'student_b', labels: [] }))
})

describe('POST /api/push/unsubscribe', () => {
  it('removes an iPhone by its device token', async () => {
    const db = useDb([[{ id: 'other-device' }]])
    withBody({ token: 'a1b2c3d4' })

    await expect(handle({})).resolves.toEqual({ success: true })
    expect(db.delete).toHaveBeenCalled()
    expect(db.update).not.toHaveBeenCalled()
  })

  it('still removes a web subscription by its endpoint and switches the flag off when none remain', async () => {
    const db = useDb([[]])
    withBody({ endpoint: 'https://push.example/abc' })

    await handle({})

    expect(db.delete).toHaveBeenCalled()
    expect(db.updater.set).toHaveBeenCalledWith({ pushNotifications: false })
  })

  it('rejects a request with neither endpoint nor token', async () => {
    useDb()
    withBody({})

    await expect(handle({})).rejects.toMatchObject({ statusCode: 400 })
  })
})
```

Run: `yarn vitest run server/api/push`
Expected: FAIL — the iPhone cases and the `platform: 'web'` expectation fail.

- [ ] **Step 2: Implement subscribe**

Replace `server/api/push/subscribe.post.ts` with:

```ts
import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { pushSubscriptions, students } from '../../database/schema'

// An APNs device token is a hex string (64 characters today; Apple may lengthen it)
const IOS_TOKEN = /^[0-9a-f]{64,200}$/i

/** Reads either a Web Push subscription or an iPhone device token from the request body. */
function readSubscription(body: any) {
    if (body?.platform === 'ios') {
        if (typeof body.token !== 'string' || !IOS_TOKEN.test(body.token)) {
            throw createError({ statusCode: 400, statusMessage: 'token is ongeldig' })
        }
        return { platform: 'ios', endpoint: body.token as string, p256dh: null, auth: null }
    }

    if (!body?.endpoint || typeof body.endpoint !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'endpoint is verplicht' })
    }
    if (!body?.keys?.p256dh || !body?.keys?.auth) {
        throw createError({ statusCode: 400, statusMessage: 'keys (p256dh, auth) zijn verplicht' })
    }
    return { platform: 'web', endpoint: body.endpoint as string, p256dh: body.keys.p256dh as string, auth: body.keys.auth as string }
}

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)
    const subscription = readSubscription(await readBody(event))

    // Upsert: a browser or phone belongs to whoever subscribed on it last
    const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
        .limit(1)

    if (existing.length > 0) {
        await db.update(pushSubscriptions)
            .set({ studentId: user.$id, ...subscription })
            .where(eq(pushSubscriptions.id, existing[0].id))
    } else {
        await db.insert(pushSubscriptions).values({
            id: generateId(),
            studentId: user.$id,
            ...subscription,
        })
    }

    // Enable push notifications on the student
    await db.update(students)
        .set({ pushNotifications: true })
        .where(eq(students.id, user.$id))

    return { success: true }
})
```

- [ ] **Step 3: Implement unsubscribe**

In `server/api/push/unsubscribe.post.ts` replace

```ts
    const body = await readBody(event)

    if (!body?.endpoint || typeof body.endpoint !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'endpoint is verplicht' })
    }

    // Delete the subscription
    await db.delete(pushSubscriptions)
        .where(
            and(
                eq(pushSubscriptions.endpoint, body.endpoint),
                eq(pushSubscriptions.studentId, user.$id)
            )
        )
```

with

```ts
    const body = await readBody(event)

    // A browser sends its endpoint, an iPhone its device token; both live in the endpoint column
    const endpoint = body?.endpoint ?? body?.token
    if (!endpoint || typeof endpoint !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'endpoint of token is verplicht' })
    }

    // Delete the subscription
    await db.delete(pushSubscriptions)
        .where(
            and(
                eq(pushSubscriptions.endpoint, endpoint),
                eq(pushSubscriptions.studentId, user.$id)
            )
        )
```

- [ ] **Step 4: Run the tests and see them pass**

Run: `yarn vitest run server/api/push` — expected: 8 passed.
Run: `yarn test:unit` — expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add server/api/push
git commit -m "Accept iPhone device tokens in the push subscribe endpoints"
```

---

### Task 6: The app registers its device and reacts to taps

**Files:**
- Create: `app/utils/nativePushDevice.ts`, `app/utils/nativePushDevice.test.ts`, `app/plugins/native-push.client.ts`
- Modify: `app/composables/usePushNotifications.ts`, `app/composables/useBookingActions.ts`, `app/composables/useAuth.ts`, `package.json` (dependency)

**Interfaces:**
- Consumes: `POST /api/push/subscribe` with `{ platform: 'ios', token }` and `POST /api/push/unsubscribe` with `{ token }` (Task 5); `pushDestination`, `PushTapData` from `~~/shared/push` (Task 3); `useNativeApp()` (milestone 1).
- Produces from `app/utils/nativePushDevice.ts`: `enablePush(): Promise<boolean>`, `disablePush(): Promise<void>`, `forgetPushDevice(): Promise<void>`, `syncPushDevice(): Promise<void>`, `offerPushAfterBooking(): Promise<void>`, `isPushEnabled(): Promise<boolean>`, `onPushTap(handler: (actionId: string, data: PushTapData) => void): Promise<void>`.

Background for the implementer:
- A Capacitor plugin object is a Proxy. Never return it from an `async` function or resolve a promise with it: JavaScript then calls its `then`, which the plugin rejects. Hand it to a callback instead (`withPush` below), exactly as `app/utils/sessionTokenStore.ts` does with `withStorage`.
- The app-mode e2e test runs this bundle in a desktop browser, where the push plugin's methods reject as "not implemented". Every function here must treat that as "push is not available" and carry on.
- iOS delivers the device token through the plugin's `registration` event after `register()` is called.

- [ ] **Step 1: Install the plugin and check its API**

```bash
yarn add @capacitor/push-notifications
```

Open `node_modules/@capacitor/push-notifications/README.md` and confirm: `checkPermissions()` and `requestPermissions()` resolve `{ receive: 'prompt' | 'granted' | 'denied' | ... }`; `register()`; `unregister()`; `addListener('registration', (token: { value: string }) => ...)`; `addListener('registrationError', (error: { error: string }) => ...)`; `addListener('pushNotificationActionPerformed', (action: { actionId: string; notification: { data: any } }) => ...)`; each `addListener` resolves a handle with `remove()`. If a shape differs, stop and report.

- [ ] **Step 2: Write the failing tests**

Create `app/utils/nativePushDevice.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const TOKEN = 'a1b2c3d4'.repeat(8)

const plugin = vi.hoisted(() => {
  const listeners = new Map<string, (arg: any) => void>()
  return {
    listeners,
    permission: 'prompt' as string,
    registrationFails: false,
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    register: vi.fn(),
    unregister: vi.fn(),
    addListener: vi.fn(),
  }
})

vi.mock('@capacitor/push-notifications', () => ({
  // Like the real plugin: a Proxy that refuses to be treated as a promise
  PushNotifications: new Proxy(plugin, {
    get(target, key) {
      if (key === 'then') throw new Error('PushNotifications.then() is not implemented')
      return (target as any)[key]
    },
  }),
}))

const storage = new Map<string, string>()
const fetchMock = vi.fn()

async function load() {
  vi.resetModules()
  return import('./nativePushDevice')
}

beforeEach(() => {
  storage.clear()
  plugin.listeners.clear()
  plugin.permission = 'prompt'
  plugin.registrationFails = false
  fetchMock.mockReset().mockResolvedValue({ success: true })
  vi.stubGlobal('$fetch', fetchMock)
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value) },
    removeItem: (key: string) => { storage.delete(key) },
  })

  plugin.checkPermissions.mockReset().mockImplementation(async () => ({ receive: plugin.permission }))
  plugin.requestPermissions.mockReset().mockImplementation(async () => {
    if (plugin.permission === 'prompt') plugin.permission = 'granted'
    return { receive: plugin.permission }
  })
  plugin.addListener.mockReset().mockImplementation(async (name: string, handler: (arg: any) => void) => {
    plugin.listeners.set(name, handler)
    return { remove: async () => { plugin.listeners.delete(name) } }
  })
  plugin.register.mockReset().mockImplementation(async () => {
    queueMicrotask(() => {
      if (plugin.registrationFails) plugin.listeners.get('registrationError')?.({ error: 'no network' })
      else plugin.listeners.get('registration')?.({ value: TOKEN })
    })
  })
  plugin.unregister.mockReset().mockResolvedValue(undefined)
})

describe('enablePush', () => {
  it('asks permission, registers the device and tells the server', async () => {
    const { enablePush, isPushEnabled } = await load()

    await expect(enablePush()).resolves.toBe(true)
    expect(fetchMock).toHaveBeenCalledWith('/api/push/subscribe', { method: 'POST', body: { platform: 'ios', token: TOKEN } })
    await expect(isPushEnabled()).resolves.toBe(true)
  })

  it('does not register when the user refuses', async () => {
    plugin.permission = 'denied'
    const { enablePush, isPushEnabled } = await load()

    await expect(enablePush()).resolves.toBe(false)
    expect(plugin.register).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
    await expect(isPushEnabled()).resolves.toBe(false)
  })

  it('reports failure when iOS cannot register the device', async () => {
    plugin.registrationFails = true
    const { enablePush } = await load()

    await expect(enablePush()).resolves.toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports failure where push does not exist, such as a desktop browser', async () => {
    plugin.checkPermissions.mockRejectedValue(new Error('Not implemented on web.'))
    plugin.requestPermissions.mockRejectedValue(new Error('Not implemented on web.'))
    const { enablePush, isPushEnabled, syncPushDevice, offerPushAfterBooking } = await load()

    await expect(enablePush()).resolves.toBe(false)
    await expect(isPushEnabled()).resolves.toBe(false)
    await expect(syncPushDevice()).resolves.toBeUndefined()
    await expect(offerPushAfterBooking()).resolves.toBeUndefined()
  })
})

describe('disablePush', () => {
  it('removes the device on the server and remembers the choice', async () => {
    const { enablePush, disablePush, isPushEnabled, syncPushDevice } = await load()
    await enablePush()
    fetchMock.mockClear()

    await disablePush()

    expect(fetchMock).toHaveBeenCalledWith('/api/push/unsubscribe', { method: 'POST', body: { token: TOKEN } })
    expect(plugin.unregister).toHaveBeenCalled()
    await expect(isPushEnabled()).resolves.toBe(false)

    // Permission is still granted at the iOS level, but the user switched it off here
    fetchMock.mockClear()
    await syncPushDevice()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('forgetPushDevice', () => {
  it('removes the device on logout without changing the preference', async () => {
    const { enablePush, forgetPushDevice, syncPushDevice } = await load()
    await enablePush()
    fetchMock.mockClear()

    await forgetPushDevice()
    expect(fetchMock).toHaveBeenCalledWith('/api/push/unsubscribe', { method: 'POST', body: { token: TOKEN } })

    // The next user who logs in on this phone gets notifications again
    fetchMock.mockClear()
    await syncPushDevice()
    expect(fetchMock).toHaveBeenCalledWith('/api/push/subscribe', { method: 'POST', body: { platform: 'ios', token: TOKEN } })
  })

  it('does nothing when the device was never registered', async () => {
    const { forgetPushDevice } = await load()

    await forgetPushDevice()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('syncPushDevice', () => {
  it('re-registers a device whose permission is already granted', async () => {
    plugin.permission = 'granted'
    const { syncPushDevice } = await load()

    await syncPushDevice()
    expect(fetchMock).toHaveBeenCalledWith('/api/push/subscribe', { method: 'POST', body: { platform: 'ios', token: TOKEN } })
  })

  it('never shows the permission prompt', async () => {
    const { syncPushDevice } = await load()

    await syncPushDevice()
    expect(plugin.requestPermissions).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('offerPushAfterBooking', () => {
  it('asks once, when permission was never decided', async () => {
    const { offerPushAfterBooking } = await load()

    await offerPushAfterBooking()
    expect(plugin.requestPermissions).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/push/subscribe', expect.anything())
  })

  it('does not ask again after a refusal', async () => {
    plugin.permission = 'denied'
    const { offerPushAfterBooking } = await load()

    await offerPushAfterBooking()
    expect(plugin.requestPermissions).not.toHaveBeenCalled()
  })
})

describe('onPushTap', () => {
  it('passes the action and the notification data to the handler', async () => {
    const { onPushTap } = await load()
    const handler = vi.fn()

    await onPushTap(handler)
    plugin.listeners.get('pushNotificationActionPerformed')?.({
      actionId: 'ROUTE',
      notification: { data: { url: '/lessen', address: 'Emmy van Leersumhof 24a', aps: {} } },
    })

    expect(handler).toHaveBeenCalledWith('ROUTE', { url: '/lessen', address: 'Emmy van Leersumhof 24a', studentId: undefined })
  })
})
```

Run: `yarn vitest run app/utils/nativePushDevice.test.ts`
Expected: FAIL — cannot resolve `./nativePushDevice`.

- [ ] **Step 3: Implement the device module**

Create `app/utils/nativePushDevice.ts`:

```ts
import type { PushNotificationsPlugin } from '@capacitor/push-notifications'
import type { PushTapData } from '~~/shared/push'

/**
 * This iPhone's push notifications: permission, registration with the server, and the user's choice.
 * Every function is safe where push does not exist (a desktop browser): it reports "not enabled" and carries on.
 */

const TOKEN_KEY = 'rav_push_token' // the device token the server knows this phone by
const OFF_KEY = 'rav_push_off' // set when the user switched notifications off in the app

// Loaded on demand so the website bundle never ships the native plugin.
// The plugin is handed to a callback instead of being returned: resolving a promise with
// a Capacitor plugin proxy makes JS call its `then`, which the plugin rejects.
async function withPush<T>(use: (push: PushNotificationsPlugin) => Promise<T>): Promise<T> {
  const { PushNotifications } = await import('@capacitor/push-notifications')
  return use(PushNotifications)
}

async function permission(): Promise<string> {
  return withPush((push) => push.checkPermissions()).then((status) => status.receive, () => 'unavailable')
}

/** Registers with iOS and resolves the device token it hands back. */
function deviceToken(): Promise<string> {
  return withPush(async (push) => {
    let settle!: { resolve: (token: string) => void; reject: (error: Error) => void }
    const token = new Promise<string>((resolve, reject) => { settle = { resolve, reject } })
    const handles = await Promise.all([
      push.addListener('registration', (registered) => settle.resolve(registered.value)),
      push.addListener('registrationError', (failure) => settle.reject(new Error(failure.error))),
    ])
    try {
      await push.register()
      return await token
    } finally {
      await Promise.all(handles.map((handle) => handle.remove()))
    }
  })
}

async function register(): Promise<boolean> {
  try {
    const token = await deviceToken()
    await $fetch('/api/push/subscribe', { method: 'POST', body: { platform: 'ios', token } })
    localStorage.setItem(TOKEN_KEY, token)
    return true
  } catch (err) {
    console.error('[Push] Registering this device failed:', err)
    return false
  }
}

async function unregister(): Promise<void> {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return
  localStorage.removeItem(TOKEN_KEY)
  await $fetch('/api/push/unsubscribe', { method: 'POST', body: { token } }).catch(() => {})
  await withPush((push) => push.unregister()).catch(() => {})
}

/** The user switches notifications on: asks permission if needed. */
export async function enablePush(): Promise<boolean> {
  const granted = await withPush((push) => push.requestPermissions()).then((status) => status.receive === 'granted', () => false)
  if (!granted) return false

  localStorage.removeItem(OFF_KEY)
  return register()
}

/** The user switches notifications off: stays off until they switch it on again. */
export async function disablePush(): Promise<void> {
  localStorage.setItem(OFF_KEY, '1')
  await unregister()
}

/** On logout: this phone stops receiving the account's notifications; the preference is kept. */
export async function forgetPushDevice(): Promise<void> {
  await unregister()
}

/** After login and at every start: keep the server's token current. Never shows a prompt. */
export async function syncPushDevice(): Promise<void> {
  if (localStorage.getItem(OFF_KEY)) return
  if (await permission() !== 'granted') return
  await register()
}

/** After a booking: the one moment the app asks, and only if the user never decided. */
export async function offerPushAfterBooking(): Promise<void> {
  if (localStorage.getItem(OFF_KEY)) return
  if (await permission() !== 'prompt') return
  await enablePush()
}

export async function isPushEnabled(): Promise<boolean> {
  return !localStorage.getItem(OFF_KEY) && !!localStorage.getItem(TOKEN_KEY) && await permission() === 'granted'
}

/** Calls the handler when the user taps a notification or one of its buttons (`actionId` is `tap` for the notification itself). */
export async function onPushTap(handler: (actionId: string, data: PushTapData) => void): Promise<void> {
  await withPush((push) => push.addListener('pushNotificationActionPerformed', ({ actionId, notification }) => {
    const { url, address, studentId } = notification.data ?? {}
    handler(actionId, { url, address, studentId })
  })).catch(() => {})
}
```

Run: `yarn vitest run app/utils/nativePushDevice.test.ts`
Expected: 12 passed.

- [ ] **Step 4: Put the native implementation behind the existing composable**

In `app/composables/usePushNotifications.ts`:

1. Rename the existing export: change `export const usePushNotifications = () => {` to `const useWebPush = () => {`. Its body stays exactly as it is.

2. Add at the end of the file:

```ts
/** The same interface inside the iOS app, backed by native notifications. */
const useNativePush = () => {
  const isSupported = ref(true)
  const isSubscribed = ref(false)
  const permissionState = ref<NotificationPermission>('default')

  async function checkSubscription() {
    isSubscribed.value = await isPushEnabled()
  }

  async function subscribe(): Promise<boolean> {
    isSubscribed.value = await enablePush()
    return isSubscribed.value
  }

  async function unsubscribe(): Promise<boolean> {
    await disablePush()
    isSubscribed.value = false
    return true
  }

  checkSubscription()

  return {
    isSupported,
    isSubscribed,
    permissionState,
    subscribe,
    unsubscribe,
    checkSubscription,
  }
}

export const usePushNotifications = () => useNativeApp().isNativeApp ? useNativePush() : useWebPush()
```

(`isPushEnabled`, `enablePush` and `disablePush` are auto-imported from `app/utils`.)

- [ ] **Step 5: Ask after the first booking, forget the device on logout**

In `app/composables/useBookingActions.ts`, in `handleBooking`, replace

```ts
      } else {
        await refreshUser()
        await refreshCredits()
      }
    })
  }

  async function cancelBooking(booking: any) {
```

with

```ts
      } else {
        await refreshUser()
        await refreshCredits()
        // The moment a reminder becomes useful: offer notifications, once
        if (isNativeApp) void offerPushAfterBooking()
      }
    })
  }

  async function cancelBooking(booking: any) {
```

and, in the same file, directly after the line `const { call, error, pending } = useApiCall()` add:

```ts
  const { isNativeApp } = useNativeApp()
```

In `app/composables/useAuth.ts`, replace

```ts
  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
```

with

```ts
  async function logout() {
    // While still logged in: this phone stops receiving the account's notifications
    if (useNativeApp().isNativeApp) await forgetPushDevice()
    await $fetch('/api/auth/logout', { method: 'POST' })
```

- [ ] **Step 6: Keep the device registered and route taps**

Create `app/plugins/native-push.client.ts`:

```ts
import { pushDestination } from '~~/shared/push'

/**
 * iOS app only: keeps this phone registered for the logged-in user's notifications,
 * and takes the user to the right place when they tap one.
 */
export default defineNuxtPlugin(() => {
  if (!useNativeApp().isNativeApp) return

  const { user } = useAuth()
  const router = useRouter()

  watch(() => user.value?.$id, (id) => {
    if (id) void syncPushDevice()
  }, { immediate: true })

  void onPushTap((actionId, data) => {
    const destination = pushDestination(actionId, data)
    if ('maps' in destination) {
      window.open(`https://maps.apple.com/?daddr=${encodeURIComponent(destination.maps)}`, '_blank')
    } else {
      void router.push(destination.path)
    }
  })
})
```

- [ ] **Step 7: Verify**

Run: `yarn test:unit` — expected: all pass.
Run: `yarn test:e2e:branch` — expected: 6 passed (the website's push toggle path is untouched).
Run: `yarn test:e2e:branch --app` — expected: 1 passed. This run books a lesson and logs out inside the bundle in a desktop browser, so it proves the new calls do not break where push does not exist.

- [ ] **Step 8: Commit**

```bash
git add app/utils/nativePushDevice.ts app/utils/nativePushDevice.test.ts app/plugins/native-push.client.ts app/composables/usePushNotifications.ts app/composables/useBookingActions.ts app/composables/useAuth.ts package.json yarn.lock
git commit -m "Register the iPhone for notifications and route notification taps"
```

---

### Task 7: The native side — capability, token forwarding, buttons, badge

**Files:**
- Modify: `ios/App/App/AppDelegate.swift`, `ios/App/App.xcodeproj/project.pbxproj`, `capacitor.config.ts`, `CLAUDE.md`
- Create: `ios/App/App/App.entitlements`, `docs/ios/push-sample-reminder.apns`
- Generated by `cap sync`: `ios/App/CapApp-SPM/Package.swift`, `Package.resolved`

**Interfaces:**
- Consumes: category and action ids from `shared/push.ts` (Task 3), `@capacitor/push-notifications` (Task 6).
- Produces: an app that can receive pushes for `com.ravennah.app`, shows the action buttons, and clears its badge when opened.

Precondition: `git status --short ios/` must be empty before you start. If the owner has uncommitted Xcode changes there, stop and report; do not revert or commit them yourself.

- [ ] **Step 1: Sync the plugin into the native project**

```bash
NUXT_PUBLIC_API_BASE=http://localhost:3000 yarn build:ios:bundle
npx cap sync ios
```

Expected: the sync output lists `@capacitor/push-notifications` and `capacitor-secure-storage-plugin`. If it reports that the push plugin does not support Swift Package Manager, stop and report.

- [ ] **Step 2: Show notifications while the app is open**

Replace `capacitor.config.ts` with:

```ts
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.ravennah.app',
  appName: 'Yoga Ravennah',
  // The client-only member bundle from `yarn build:ios:bundle`
  webDir: '.output-ios/public',
  plugins: {
    PushNotifications: {
      // Also show a notification that arrives while the app is open
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
```

Run `npx cap sync ios` again so the native config picks it up.

- [ ] **Step 3: Add the push capability**

Create `ios/App/App/App.entitlements`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>aps-environment</key>
	<string>development</string>
</dict>
</plist>
```

In `ios/App/App.xcodeproj/project.pbxproj`, the line `PRODUCT_BUNDLE_IDENTIFIER = com.ravennah.app;` appears twice (Debug and Release). Directly above each occurrence, with the same indentation, add:

```
				CODE_SIGN_ENTITLEMENTS = App/App.entitlements;
```

Check: `grep -c "CODE_SIGN_ENTITLEMENTS = App/App.entitlements;" ios/App/App.xcodeproj/project.pbxproj` prints `2`.

(Xcode replaces `development` with `production` itself when it exports an App Store or TestFlight build.)

- [ ] **Step 4: Forward the device token, register the buttons, clear the badge**

In `ios/App/App/AppDelegate.swift`:

1. Replace the first two lines

```swift
import UIKit
import Capacitor
```

with

```swift
import UIKit
import Capacitor
import UserNotifications
```

2. Replace

```swift
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }
```

with

```swift
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        registerNotificationCategories()
        return true
    }

    /// The buttons under each kind of notification. Ids must match shared/push.ts.
    private func registerNotificationCategories() {
        func button(_ id: String, _ title: String) -> UNNotificationAction {
            UNNotificationAction(identifier: id, title: title, options: [.foreground])
        }
        func category(_ id: String, _ buttons: [UNNotificationAction]) -> UNNotificationCategory {
            UNNotificationCategory(identifier: id, actions: buttons, intentIdentifiers: [])
        }

        UNUserNotificationCenter.current().setNotificationCategories([
            category("LESSON_REMINDER", [button("ROUTE", "Route"), button("VIEW_LESSON", "Bekijk les")]),
            category("BOOKING_CHANGE", [button("VIEW_PARTICIPANTS", "Bekijk deelnemers")]),
            category("CREDITS_EMPTY", [button("ADD_CREDITS", "Credits toevoegen")]),
        ])
    }

    // Capacitor's push plugin learns the device token through these two notifications
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }
```

3. Replace

```swift
    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }
```

with

```swift
    func applicationDidBecomeActive(_ application: UIApplication) {
        // Every push sets the badge to 1; opening the app means it has been seen
        if #available(iOS 16.0, *) {
            UNUserNotificationCenter.current().setBadgeCount(0)
        } else {
            application.applicationIconBadgeNumber = 0
        }
    }
```

- [ ] **Step 5: Add a sample notification for the simulator**

Create `docs/ios/push-sample-reminder.apns`:

```json
{
  "Simulator Target Bundle": "com.ravennah.app",
  "aps": {
    "alert": { "title": "Morgen yoga!", "body": "Je hebt morgen Hatha Yoga — tot dan!" },
    "badge": 1,
    "sound": "default",
    "category": "LESSON_REMINDER"
  },
  "url": "/lessen",
  "address": "Emmy van Leersumhof 24a, 3059 LT Rotterdam"
}
```

- [ ] **Step 6: Verify the native project compiles**

```bash
xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator -configuration Debug CODE_SIGNING_ALLOWED=NO build | tail -3
```

Expected: `** BUILD SUCCEEDED **`. Paste the tail into your report.

- [ ] **Step 7: Document**

In `CLAUDE.md`, directly after the paragraph that starts with `The iOS app (Capacitor, `ios/`)` add this paragraph:

```
Push: `server/utils/push.ts` delivers each notification to browsers (Web Push) and iPhones (APNs, `server/utils/apns.ts`); `push_subscriptions.platform` says which. Notification categories, action ids and tap destinations live in `shared/push.ts`; the same ids are registered in `ios/App/App/AppDelegate.swift` — change them together. Without `NUXT_APNS_KEY` nothing is sent to iPhones. To try a notification in the simulator: `xcrun simctl push booted com.ravennah.app docs/ios/push-sample-reminder.apns`.
```

- [ ] **Step 8: Commit**

```bash
git status --short
git add capacitor.config.ts ios CLAUDE.md docs/ios/push-sample-reminder.apns
git commit -m "Add the push capability, notification buttons and badge handling to the iOS app"
```

Before committing, check `git status --short`: commit nothing under `ios/App/App/public`, `DerivedData`, `xcuserdata` or `ios/App/build`.

- [ ] **Step 9: Simulator and device checklist (owner, manual)**

In the simulator (`yarn dev` in one terminal, `yarn dev:ios` in another):
- [ ] No permission prompt at launch or at login.
- [ ] After the first booking, iOS asks for notification permission.
- [ ] With permission granted, `xcrun simctl push booted com.ravennah.app docs/ios/push-sample-reminder.apns` shows the notification, also while the app is open.
- [ ] Long-pressing it shows "Route" and "Bekijk les"; "Bekijk les" opens `/lessen`; "Route" opens Maps with the studio address.
- [ ] The app icon shows a badge after the push and loses it when the app is opened.
- [ ] Switching notifications off in account details keeps them off after restarting the app.

On a real iPhone, once the APNs key is in the server's environment (`NUXT_APNS_KEY`, `NUXT_APNS_KEY_ID`, `NUXT_APNS_TEAM_ID`, and `NUXT_APNS_PRODUCTION=true` on the live site):
- [ ] As an admin, `POST /api/push/test` (the existing test endpoint) delivers a notification to the phone.
- [ ] A booking made by another account delivers "Nieuwe boeking" with "Bekijk deelnemers" to the admin's phone.

---

### Task 8: A Keychain hiccup is not a logout

**Files:**
- Modify: `app/utils/sessionTokenStore.ts`
- Create: `app/utils/sessionTokenStore.test.ts`

**Interfaces:**
- Produces: unchanged `sessionTokenStore: TokenStore`. `get()` rejects on a Keychain error instead of answering null, and `set()` only remembers a token the Keychain accepted.

- [ ] **Step 1: Write the failing tests**

Create `app/utils/sessionTokenStore.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const keychain = vi.hoisted(() => ({
  items: new Map<string, string>(),
  failing: false,
}))

vi.mock('capacitor-secure-storage-plugin', () => {
  const guard = () => { if (keychain.failing) throw new Error('Keychain is locked') }
  const plugin = {
    async keys() { guard(); return { value: [...keychain.items.keys()] } },
    async get({ key }: { key: string }) {
      guard()
      if (!keychain.items.has(key)) throw new Error('Item with given key does not exist')
      return { value: keychain.items.get(key)! }
    },
    async set({ key, value }: { key: string; value: string }) { guard(); keychain.items.set(key, value); return { value: true } },
    async remove({ key }: { key: string }) { guard(); keychain.items.delete(key); return { value: true } },
  }
  return {
    // Like the real plugin: a Proxy that refuses to be treated as a promise
    SecureStoragePlugin: new Proxy(plugin, {
      get(target, key) {
        if (key === 'then') throw new Error('SecureStoragePlugin.then() is not implemented')
        return (target as any)[key]
      },
    }),
  }
})

async function load() {
  vi.resetModules()
  return (await import('./sessionTokenStore')).sessionTokenStore
}

beforeEach(() => {
  keychain.items.clear()
  keychain.failing = false
})

describe('sessionTokenStore', () => {
  it('answers null when no token was ever stored', async () => {
    const store = await load()
    await expect(store.get()).resolves.toBeNull()
  })

  it('returns a stored token, also after a restart', async () => {
    await (await load()).set('token-1')

    const afterRestart = await load()
    await expect(afterRestart.get()).resolves.toBe('token-1')
  })

  it('does not mistake a Keychain error for "logged out"', async () => {
    keychain.items.set('rav_session_token', 'token-1')
    const store = await load()

    keychain.failing = true
    await expect(store.get()).rejects.toThrow('Keychain is locked')

    keychain.failing = false
    await expect(store.get()).resolves.toBe('token-1')
  })

  it('does not remember a token the Keychain refused', async () => {
    const store = await load()

    keychain.failing = true
    await expect(store.set('token-2')).rejects.toThrow('Keychain is locked')

    keychain.failing = false
    await expect(store.get()).resolves.toBeNull()
  })

  it('forgets the token on clear', async () => {
    const store = await load()
    await store.set('token-1')
    await store.clear()

    await expect(store.get()).resolves.toBeNull()
    await expect((await load()).get()).resolves.toBeNull()
  })
})
```

Run: `yarn vitest run app/utils/sessionTokenStore.test.ts`
Expected: FAIL — "does not mistake a Keychain error" (resolves null instead of rejecting) and "does not remember a token the Keychain refused" (returns `token-2`).

- [ ] **Step 2: Implement**

In `app/utils/sessionTokenStore.ts`, replace the `sessionTokenStore` object with:

```ts
/** The iOS app's session token, kept in the Keychain. */
export const sessionTokenStore: TokenStore = {
  async get() {
    if (cached === undefined) {
      // Ask which keys exist first: a failing read then means "Keychain unavailable",
      // which must surface as an error and not be remembered as "no token"
      cached = await withStorage(async (storage) => {
        const { value: keys } = await storage.keys()
        return keys.includes(KEY) ? (await storage.get({ key: KEY })).value : null
      })
    }
    return cached
  },
  async set(token) {
    await withStorage((storage) => storage.set({ key: KEY, value: token }))
    cached = token
  },
  async clear() {
    cached = null
    await withStorage((storage) => storage.remove({ key: KEY })).catch(() => {})
  },
}
```

- [ ] **Step 3: Run the tests and see them pass**

Run: `yarn vitest run app/utils/sessionTokenStore.test.ts` — expected: 5 passed.
Run: `yarn test:unit` — expected: all pass.
Run: `yarn test:e2e:branch --app` — expected: 1 passed (the browser fallback of the storage plugin still logs in, stays signed in and logs out).

- [ ] **Step 4: Commit**

```bash
git add app/utils/sessionTokenStore.ts app/utils/sessionTokenStore.test.ts
git commit -m "Do not treat a Keychain error as a logout"
```

---

## Release steps for the owner

In this order:

1. Review and merge the pull request, but do not let it deploy yet if merging deploys automatically — do step 2 first.
2. Apply the migration to production:
   `NUXT_DATABASE_URL="<production connection string>" tsx --tsconfig scripts/tsconfig.json scripts/migrate-0006-ios-push.ts --yes`
3. Deploy.
4. Add the APNs settings to the production environment: `NUXT_APNS_KEY`, `NUXT_APNS_KEY_ID`, `NUXT_APNS_TEAM_ID`, `NUXT_APNS_PRODUCTION=true`.
5. Build and upload a new TestFlight build (`yarn build:ios`, then archive in Xcode).

Anyone logged in to a TestFlight build made before this release is logged out once, because sessions created before the migration count as website sessions.

## Self-review notes

- Spec section 3: storage (Task 1), sending (Tasks 3–4), in the app (Tasks 5–6), action buttons (Tasks 3, 4, 7). Section 4 badge: Tasks 3 and 7. Milestone 2 of section 7: all tasks.
- Spec "to verify" items settled here: action buttons need a few lines of Swift (Task 7); production migrations are applied with a per-migration script because the Drizzle migration table is out of sync (Task 1); the reminder keeps no cancel button.
- Not in this milestone: calendar, haptics, share sheet, universal links, real icon and splash, bundled icons, account deletion, the `/privacy` page (already live), App Store submission.
