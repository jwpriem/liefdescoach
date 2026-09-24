# Neon Branch E2E Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the Playwright E2E suite locally, with one command, against a throwaway copy of an anonymised production database, and never touch production data.

**Architecture:** Three kinds of Neon branch live in project "Yoga Ravennah" (`orange-shape-96414119`):
- **`seed`:** a copy of `production` with all personal data removed or replaced. It is created and anonymised by `yarn db:refresh-seed`.
- **`dev`:** a long-lived child of `seed`, for `yarn dev`.
- **`e2e-<timestamp>`:** a fresh child of `seed` for every `yarn test:e2e:branch` run, seeded with known test users and lessons and deleted afterwards.

A small Neon REST client in `scripts/lib/neon.ts` does all branch work and refuses to modify anything that looks like production.

**Tech Stack:** Neon REST API v2 via Node 20 `fetch` (no new dependencies), `@neondatabase/serverless` + Drizzle for SQL, `bcryptjs`, `tsx` scripts, Playwright, Vitest.

**Spec:** No separate spec doc. This plan implements the approach agreed in the 2026-09-24 session: an anonymised `seed` branch, a `dev` branch for local development, an ephemeral branch per E2E run, and **local only (no CI)**.

## Global Constraints

- **Never write to the `production` branch.** Every script that modifies a branch goes through `assertSafeToModify()` (Task 1). Every script that runs SQL on a branch first checks with `assertNotProductionUrl()` that the connection host isn't a production endpoint.
- **Secrets are never printed.** Connection strings and the API key go only into child-process environments, or to stdout when piped (`db:branch-url`); they never appear in logs.
- **No new runtime or dev dependencies.** Use Node 20 global `fetch`, and the existing `@neondatabase/serverless`, `drizzle-orm`, `bcryptjs`, `dotenv` and `tsx`.
- **No database migrations** (CLAUDE.md). Branches inherit production's schema as-is.
- Required `.env` keys (added by the user in Task 0): `NEON_API_KEY`, `NEON_PROJECT_ID=orange-shape-96414119`.
- Anonymised emails use the reserved `.test` TLD (`@example.test`), so they can never be delivered.
- Unit tests: `yarn test:unit`. Baseline before starting: **21 files, 192 tests passing** (confirm in Task 1, Step 1).
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **The app under test silently connects to production.** For example, if `.env` beat the runner's `NUXT_DATABASE_URL`. The runner must refuse to start Playwright unless the served `/api/lessons` contains the seeded lesson ID `e2e-lesson-1`, which only exists on the test branch. Pinned in Task 5 (`isServingTestBranch` tests).
2. **A future table or column holds personal data and is copied unanonymised.** Every table in `server/database/schema.ts`, and every `students` column, must have an explicit anonymisation policy, or the unit tests fail. Pinned in Task 2 (policy coverage tests).
3. **A crashed or Ctrl-C'd run leaves branches behind** and eventually hits the Free-plan branch limit. The runner cleans up in `finally` and on SIGINT/SIGTERM, and deletes leftover `e2e-*` branches at start. Pinned in Task 5 (`staleE2EBranches` test).
4. **A script is pointed at production** by a typo, a wrong `.env`, or a renamed branch. `assertSafeToModify` rejects primary, default, protected and `production` branches, and any branch name outside `seed` / `dev` / `e2e-*`. `assertNotProductionUrl` rejects a production host, including the `-pooler` form. Pinned in Task 1.
5. **Anonymisation half-applies.** It runs in one transaction, and `verifyAnonymised` must report zero leftovers, or the refresh aborts and deletes the half-made `seed`. Pinned in Task 2 (`verifyAnonymised` tests) and Task 3 (refresh flow).

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `scripts/lib/neon.ts` | Create | Neon REST client + `assertSafeToModify` / `assertNotProductionUrl` guards |
| `scripts/lib/neon.test.ts` | Create | Client and guard tests with a fake `fetch` |
| `scripts/lib/anonymise.ts` | Create | Per-table/column anonymisation policy, SQL statements, verification |
| `scripts/lib/anonymise.test.ts` | Create | Policy coverage + statement/verification tests |
| `scripts/neon-refresh-seed.ts` | Create | `yarn db:refresh-seed`: rebuild `seed` (anonymised) and `dev` |
| `scripts/neon-branch-url.ts` | Create | `yarn db:branch-url <name>`: print a non-production branch's connection string (for piping to `pbcopy`) |
| `e2e/fixtures.ts` | Create | Test user, password and lesson IDs shared by the seed script and specs |
| `scripts/lib/seed-e2e.ts` | Create | Upsert the test student, admin, credits and lessons on a test branch |
| `e2e/helpers.ts` | Create | Shared `login` / `logout` for the current passkey-first UI |
| `e2e/booking.spec.ts` | Modify | Drop the Appwrite-era login; use the helpers and fixtures |
| `e2e/registration.spec.ts` | Modify | Open the register form from the passkey-first screen |
| `scripts/e2e-branch.ts` | Create | `yarn test:e2e:branch`: branch → seed → dev server → Playwright → cleanup |
| `scripts/lib/e2e-runner.ts` | Create | Pure helpers for the runner (`e2eBranchName`, `staleE2EBranches`, `isServingTestBranch`) |
| `scripts/lib/e2e-runner.test.ts` | Create | Tests for those helpers |
| `vitest.config.ts` | Modify | Include `scripts/**/*.test.ts` |
| `package.json` | Modify | Add `db:refresh-seed`, `db:branch-url`, `test:e2e:branch` |
| `CLAUDE.md` | Modify | Document the branch workflow |

---

### Task 0: Prerequisites (user, in the Neon console and `.env`)

These need the user's own accounts. The executor pauses here until they're done.

- [ ] **Step 1: Create a Neon API key.** In the Neon console go to Account settings → API keys → Create, then add it to `.env`:

```
NEON_API_KEY=<key>
NEON_PROJECT_ID=orange-shape-96414119
```

- [ ] **Step 2: Protect `production`** (recommended). In the Neon console go to Branches → production → Set as protected. If your plan doesn't offer this, skip it; `assertSafeToModify` still guards in code.

- [ ] **Step 3: The executor confirms the key works without printing it.**

Run: `node -e "require('dotenv').config(); fetch('https://console.neon.tech/api/v2/projects/'+process.env.NEON_PROJECT_ID+'/branches',{headers:{Authorization:'Bearer '+process.env.NEON_API_KEY}}).then(r=>r.json()).then(j=>console.log(j.branches.map(b=>b.name)))"`
Expected: `[ 'production' ]`

---

### Task 1: Neon REST client with production guards

**Files:**
- Create: `scripts/lib/neon.ts`
- Test: `scripts/lib/neon.test.ts`
- Modify: `vitest.config.ts` (include pattern)

**Interfaces:**
- Produces:
  - `interface NeonBranch { id: string; name: string; parent_id?: string; primary?: boolean; default?: boolean; protected?: boolean; created_at?: string }`
  - `createNeonClient(opts: { apiKey: string; projectId: string; fetch?: typeof fetch; pollMs?: number }): NeonClient`, where `NeonClient` has:
    - `listBranches(): Promise<NeonBranch[]>`
    - `findBranch(name: string): Promise<NeonBranch | undefined>`
    - `productionHosts(): Promise<string[]>`: endpoint hosts of every primary/default branch
    - `createBranch(name: string, parentId: string): Promise<{ branch: NeonBranch; connectionUri: string }>`: waits for its operations to finish
    - `connectionUri(branch: NeonBranch): Promise<string>`
    - `deleteBranch(branch: NeonBranch): Promise<void>`: calls `assertSafeToModify` first, then waits for operations
  - `assertSafeToModify(branch: NeonBranch): void`: throws unless the name is `seed`, `dev` or starts with `e2e-`, and the branch is not primary/default/protected/`production`
  - `assertNotProductionUrl(url: string, productionHosts: string[]): void`: throws if the URL host, with `-pooler` removed, equals a production host with `-pooler` removed
  - `neonClientFromEnv(): NeonClient`: reads `NEON_API_KEY` / `NEON_PROJECT_ID` and throws a clear error if either is missing

- [ ] **Step 1: Confirm the baseline and include script tests in Vitest**

Run: `yarn test:unit 2>&1 | tail -4`
Expected: `Test Files  21 passed (21)` / `Tests  192 passed (192)`

In `vitest.config.ts`, change the `include` line to:

```ts
    include: ['server/**/*.test.ts', 'plugins/**/*.test.ts', 'stores/**/*.test.ts', 'scripts/**/*.test.ts'],
```

- [ ] **Step 2: Write the failing tests**

`scripts/lib/neon.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { createNeonClient, assertSafeToModify, assertNotProductionUrl, type NeonBranch } from './neon'

const API = 'https://console.neon.tech/api/v2/projects/proj-1'
const production: NeonBranch = { id: 'br-prod', name: 'production', primary: true, default: true }
const seed: NeonBranch = { id: 'br-seed', name: 'seed', parent_id: 'br-prod' }

/** Fake fetch answering by "METHOD path" → JSON body. Records every call. */
function fakeFetch(routes: Record<string, any>) {
    return vi.fn(async (url: string, init: RequestInit = {}) => {
        const key = `${init.method ?? 'GET'} ${url.replace(API, '')}`
        if (!(key in routes)) return new Response(JSON.stringify({ message: `no route ${key}` }), { status: 404 })
        return new Response(JSON.stringify(routes[key]), { status: 200 })
    })
}

describe('assertSafeToModify', () => {
    it.each([
        ['production by name', { id: 'x', name: 'production' }],
        ['primary branch', { id: 'x', name: 'seed', primary: true }],
        ['default branch', { id: 'x', name: 'dev', default: true }],
        ['protected branch', { id: 'x', name: 'e2e-1', protected: true }],
        ['unknown name', { id: 'x', name: 'staging' }],
    ])('refuses a %s', (_label, branch) => {
        expect(() => assertSafeToModify(branch as NeonBranch)).toThrow(/Refusing/)
    })

    it.each(['seed', 'dev', 'e2e-20260924-101500'])('allows %s', (name) => {
        expect(() => assertSafeToModify({ id: 'x', name })).not.toThrow()
    })
})

describe('assertNotProductionUrl', () => {
    const prodHosts = ['ep-empty-resonance-agcehj7b.c-2.eu-central-1.aws.neon.tech']

    it('refuses the production host', () => {
        expect(() => assertNotProductionUrl('postgresql://u:p@ep-empty-resonance-agcehj7b.c-2.eu-central-1.aws.neon.tech/neondb', prodHosts)).toThrow(/production/)
    })

    it('refuses the pooled production host', () => {
        expect(() => assertNotProductionUrl('postgresql://u:p@ep-empty-resonance-agcehj7b-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require', prodHosts)).toThrow(/production/)
    })

    it('allows another endpoint', () => {
        expect(() => assertNotProductionUrl('postgresql://u:p@ep-other-123.c-2.eu-central-1.aws.neon.tech/neondb', prodHosts)).not.toThrow()
    })

    it('refuses when production hosts are unknown', () => {
        expect(() => assertNotProductionUrl('postgresql://u:p@ep-other-123.neon.tech/neondb', [])).toThrow(/production/)
    })
})

describe('createNeonClient', () => {
    it('sends the API key and lists branches', async () => {
        const fetch = fakeFetch({ 'GET /branches': { branches: [production, seed] } })
        const client = createNeonClient({ apiKey: 'key-1', projectId: 'proj-1', fetch })

        await expect(client.findBranch('seed')).resolves.toEqual(seed)
        expect(fetch.mock.calls[0][1].headers).toMatchObject({ Authorization: 'Bearer key-1' })
    })

    it('creates a branch with a read-write endpoint and waits for its operations', async () => {
        const fetch = fakeFetch({
            'POST /branches': {
                branch: { id: 'br-e2e', name: 'e2e-1', parent_id: 'br-seed' },
                operations: [{ id: 'op-1', status: 'running' }],
                connection_uris: [{ connection_uri: 'postgresql://u:p@ep-e2e.neon.tech/neondb' }],
            },
            'GET /operations/op-1': { operation: { id: 'op-1', status: 'finished' } },
        })
        const client = createNeonClient({ apiKey: 'k', projectId: 'proj-1', fetch, pollMs: 0 })

        const result = await client.createBranch('e2e-1', 'br-seed')

        expect(result.connectionUri).toBe('postgresql://u:p@ep-e2e.neon.tech/neondb')
        const body = JSON.parse(fetch.mock.calls[0][1].body as string)
        expect(body).toEqual({ branch: { name: 'e2e-1', parent_id: 'br-seed' }, endpoints: [{ type: 'read_write' }] })
        expect(fetch).toHaveBeenCalledWith(`${API}/operations/op-1`, expect.anything())
    })

    it('fails when a branch operation fails', async () => {
        const fetch = fakeFetch({
            'POST /branches': { branch: { id: 'br-e2e', name: 'e2e-1' }, operations: [{ id: 'op-1' }], connection_uris: [{ connection_uri: 'x' }] },
            'GET /operations/op-1': { operation: { id: 'op-1', status: 'failed' } },
        })
        const client = createNeonClient({ apiKey: 'k', projectId: 'proj-1', fetch, pollMs: 0 })

        await expect(client.createBranch('e2e-1', 'br-seed')).rejects.toThrow(/op-1.*failed/)
    })

    it('never sends a DELETE for production', async () => {
        const fetch = fakeFetch({})
        const client = createNeonClient({ apiKey: 'k', projectId: 'proj-1', fetch })

        await expect(client.deleteBranch(production)).rejects.toThrow(/Refusing/)
        expect(fetch).not.toHaveBeenCalled()
    })

    it('collects endpoint hosts of the production branch', async () => {
        const fetch = fakeFetch({
            'GET /branches': { branches: [production, seed] },
            'GET /branches/br-prod/endpoints': { endpoints: [{ host: 'ep-prod.neon.tech' }] },
        })
        const client = createNeonClient({ apiKey: 'k', projectId: 'proj-1', fetch })

        await expect(client.productionHosts()).resolves.toEqual(['ep-prod.neon.tech'])
    })

    it('surfaces API errors with the status code', async () => {
        const fetch = fakeFetch({})
        const client = createNeonClient({ apiKey: 'k', projectId: 'proj-1', fetch })

        await expect(client.listBranches()).rejects.toThrow(/404/)
    })
})
```

- [ ] **Step 3: Run it to verify it fails**

Run: `yarn test:unit scripts/lib/neon.test.ts`
Expected: FAIL, `Failed to load url ./neon`.

- [ ] **Step 4: Implement**

`scripts/lib/neon.ts`:

```ts
/**
 * Minimal Neon REST API v2 client for managing test branches.
 * Everything that modifies a branch is guarded against touching production.
 */

const API_BASE = 'https://console.neon.tech/api/v2'

export interface NeonBranch {
    id: string
    name: string
    parent_id?: string
    primary?: boolean
    default?: boolean
    protected?: boolean
    created_at?: string
}

interface Operation { id: string; status?: string }

const MODIFIABLE_NAME = /^(seed|dev|e2e-.+)$/
const FAILED_STATUSES = new Set(['failed', 'error', 'cancelled'])

export function assertSafeToModify(branch: NeonBranch): void {
    if (branch.primary || branch.default || branch.protected || branch.name === 'production' || !MODIFIABLE_NAME.test(branch.name)) {
        throw new Error(`Refusing to modify Neon branch "${branch.name}" (${branch.id}): only seed, dev and e2e-* branches may be changed`)
    }
}

const normaliseHost = (host: string) => host.toLowerCase().replace('-pooler.', '.')

export function assertNotProductionUrl(url: string, productionHosts: string[]): void {
    if (productionHosts.length === 0) {
        throw new Error('Refusing to connect: production endpoint hosts are unknown')
    }
    const host = normaliseHost(new URL(url).hostname)
    if (productionHosts.map(normaliseHost).includes(host)) {
        throw new Error('Refusing to connect: this connection string points at the production endpoint')
    }
}

export function createNeonClient(opts: { apiKey: string; projectId: string; fetch?: typeof fetch; pollMs?: number }) {
    const doFetch = opts.fetch ?? fetch
    const pollMs = opts.pollMs ?? 1000
    const projectPath = `${API_BASE}/projects/${opts.projectId}`

    async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
        const res = await doFetch(`${projectPath}${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${opts.apiKey}`,
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: body === undefined ? undefined : JSON.stringify(body),
        })
        if (!res.ok) {
            const text = await res.text().catch(() => '')
            throw new Error(`Neon API ${method} ${path} failed with ${res.status}: ${text.slice(0, 200)}`)
        }
        return res.json() as Promise<T>
    }

    async function waitForOperations(operations: Operation[] = []) {
        for (const op of operations) {
            for (;;) {
                const { operation } = await api<{ operation: Operation }>('GET', `/operations/${op.id}`)
                if (operation.status === 'finished' || operation.status === 'skipped') break
                if (FAILED_STATUSES.has(operation.status ?? '')) {
                    throw new Error(`Neon operation ${op.id} ${operation.status}`)
                }
                await new Promise((resolve) => setTimeout(resolve, pollMs))
            }
        }
    }

    async function listBranches(): Promise<NeonBranch[]> {
        const { branches } = await api<{ branches: NeonBranch[] }>('GET', '/branches')
        return branches
    }

    return {
        listBranches,

        async findBranch(name: string) {
            return (await listBranches()).find((b) => b.name === name)
        },

        async productionHosts() {
            const prodBranches = (await listBranches()).filter((b) => b.primary || b.default || b.name === 'production')
            const hosts: string[] = []
            for (const branch of prodBranches) {
                const { endpoints } = await api<{ endpoints: { host: string }[] }>('GET', `/branches/${branch.id}/endpoints`)
                hosts.push(...endpoints.map((e) => e.host))
            }
            return hosts
        },

        async createBranch(name: string, parentId: string) {
            assertSafeToModify({ id: '(new)', name })
            const result = await api<{ branch: NeonBranch; operations: Operation[]; connection_uris?: { connection_uri: string }[] }>(
                'POST', '/branches',
                { branch: { name, parent_id: parentId }, endpoints: [{ type: 'read_write' }] }
            )
            await waitForOperations(result.operations)
            const connectionUri = result.connection_uris?.[0]?.connection_uri
            if (!connectionUri) throw new Error(`Neon did not return a connection string for branch ${name}`)
            return { branch: result.branch, connectionUri }
        },

        async connectionUri(branch: NeonBranch) {
            const { databases } = await api<{ databases: { name: string; owner_name: string }[] }>('GET', `/branches/${branch.id}/databases`)
            const database = databases[0]
            if (!database) throw new Error(`Branch ${branch.name} has no database`)
            const query = new URLSearchParams({ branch_id: branch.id, database_name: database.name, role_name: database.owner_name })
            const { uri } = await api<{ uri: string }>('GET', `/connection_uri?${query}`)
            return uri
        },

        async deleteBranch(branch: NeonBranch) {
            assertSafeToModify(branch)
            const { operations } = await api<{ operations: Operation[] }>('DELETE', `/branches/${branch.id}`)
            await waitForOperations(operations)
        },
    }
}

export type NeonClient = ReturnType<typeof createNeonClient>

export function neonClientFromEnv(): NeonClient {
    const apiKey = process.env.NEON_API_KEY
    const projectId = process.env.NEON_PROJECT_ID
    if (!apiKey || !projectId) {
        throw new Error('Set NEON_API_KEY and NEON_PROJECT_ID in .env (see docs/superpowers/plans/2026-09-24-neon-branch-e2e.md, Task 0)')
    }
    return createNeonClient({ apiKey, projectId })
}
```

- [ ] **Step 5: Run the tests**

Run: `yarn test:unit scripts/lib/neon.test.ts`
Expected: PASS (18 tests).

- [ ] **Step 6: Run the whole suite and commit**

Run: `yarn test:unit 2>&1 | tail -4`
Expected: PASS, 22 files.

```bash
git add vitest.config.ts scripts/lib/neon.ts scripts/lib/neon.test.ts
git commit -m "Add guarded Neon branch client for test branches

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Anonymisation policy, SQL and verification

**Files:**
- Create: `scripts/lib/anonymise.ts`
- Test: `scripts/lib/anonymise.test.ts`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces:
  - `TABLE_POLICY: Record<string, 'keep' | 'anonymise' | 'wipe'>`, keyed by SQL table name
  - `STUDENT_COLUMN_POLICY: Record<string, 'keep' | 'fake' | 'null'>`, keyed by SQL column name of `students`
  - `anonymiseStatements(): string[]`: SQL statements to run in one transaction, in order
  - `VERIFY_QUERIES: { label: string; sql: string }[]`: each returns one row `{ n: number }`; any `n > 0` is a leftover
  - `verifyAnonymised(run: (sql: string) => Promise<{ n: number | string }[]>): Promise<string[]>`: labels of failed checks (empty list = clean)

**Decisions:**
- **`students`:**
  - `name` becomes `Student <6 hex>` and `email` becomes `student-<10 hex>@example.test` (both derived from `md5(id)`, so they stay unique).
  - `password_hash`, `phone` and `date_of_birth` become NULL.
  - Flags (`is_admin`, `archived`, and so on) and `created_at` are kept.
- **`health`:**
  - `injury` becomes `'Testblessure'` where it was set.
  - `pregnancy` becomes false and `due_date` becomes NULL.
  - The rows are kept, so the UI still has realistic shapes.
- **Wiped** (personal or credential data with no test value): `sessions`, `otp_codes`, `passkey_credentials`, `push_subscriptions` (so no pushes reach real phones), `login_history` (IP addresses and user agents).
- **Kept:** `lessons`, `bookings`, `credits`. They contain no personal data beyond links to students.

- [ ] **Step 1: Write the failing tests**

`scripts/lib/anonymise.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { is } from 'drizzle-orm'
import { getTableConfig, PgTable } from 'drizzle-orm/pg-core'
import * as schema from '../../server/database/schema'
import { TABLE_POLICY, STUDENT_COLUMN_POLICY, anonymiseStatements, VERIFY_QUERIES, verifyAnonymised } from './anonymise'

const tables = Object.values(schema)
    .filter((value): value is PgTable => is(value, PgTable))
    .map((table) => getTableConfig(table))

describe('anonymisation policy', () => {
    it('finds the schema tables (guards the detection itself)', () => {
        expect(tables.map((t) => t.name)).toContain('students')
        expect(tables.length).toBeGreaterThanOrEqual(10)
    })

    it.each(tables.map((t) => t.name))('has an explicit policy for table %s', (name) => {
        expect(TABLE_POLICY[name], `Add "${name}" to TABLE_POLICY in scripts/lib/anonymise.ts`).toBeDefined()
    })

    it('has an explicit policy for every students column', () => {
        const columns = tables.find((t) => t.name === 'students')!.columns.map((c) => c.name)
        const missing = columns.filter((c) => !(c in STUDENT_COLUMN_POLICY))
        expect(missing, 'Add these columns to STUDENT_COLUMN_POLICY').toEqual([])
    })

    it('has no policy entries for tables that no longer exist', () => {
        const names = tables.map((t) => t.name)
        expect(Object.keys(TABLE_POLICY).filter((n) => !names.includes(n))).toEqual([])
    })
})

describe('anonymiseStatements', () => {
    const statements = anonymiseStatements()

    it('wipes every table marked wipe', () => {
        for (const [table, policy] of Object.entries(TABLE_POLICY)) {
            if (policy === 'wipe') expect(statements).toContain(`DELETE FROM "${table}"`)
        }
    })

    it('nulls every students column marked null and fakes name and email', () => {
        const update = statements.find((s) => s.startsWith('UPDATE "students"'))!
        for (const [column, policy] of Object.entries(STUDENT_COLUMN_POLICY)) {
            if (policy === 'null') expect(update).toContain(`"${column}" = NULL`)
        }
        expect(update).toContain(`"name" = 'Student ' || left(md5("id"), 6)`)
        expect(update).toContain(`'@example.test'`)
    })

    it('scrubs health details', () => {
        expect(statements.some((s) => s.startsWith('UPDATE "health"') && s.includes(`'Testblessure'`))).toBe(true)
    })
})

describe('verifyAnonymised', () => {
    it('returns nothing when every check is zero', async () => {
        const run = vi.fn().mockResolvedValue([{ n: 0 }])
        await expect(verifyAnonymised(run)).resolves.toEqual([])
        expect(run).toHaveBeenCalledTimes(VERIFY_QUERIES.length)
    })

    it('returns the label of every failing check', async () => {
        const run = vi.fn(async (sql: string) => [{ n: sql === VERIFY_QUERIES[0].sql ? '3' : 0 }])
        await expect(verifyAnonymised(run)).resolves.toEqual([VERIFY_QUERIES[0].label])
    })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn test:unit scripts/lib/anonymise.test.ts`
Expected: FAIL, `Failed to load url ./anonymise`.

- [ ] **Step 3: Implement**

`scripts/lib/anonymise.ts`:

```ts
/**
 * Turns a copy of production into test data: personal data is replaced or removed.
 * Every table and every students column must be listed here — the unit tests fail
 * when the schema gains one that isn't, so new personal data can't slip through.
 */

export const TABLE_POLICY: Record<string, 'keep' | 'anonymise' | 'wipe'> = {
    students: 'anonymise',
    health: 'anonymise',
    lessons: 'keep',
    bookings: 'keep',
    credits: 'keep',
    sessions: 'wipe',
    otp_codes: 'wipe',
    passkey_credentials: 'wipe',
    push_subscriptions: 'wipe',
    login_history: 'wipe',
}

export const STUDENT_COLUMN_POLICY: Record<string, 'keep' | 'fake' | 'null'> = {
    id: 'keep',
    name: 'fake',
    email: 'fake',
    password_hash: 'null',
    is_admin: 'keep',
    email_verified: 'keep',
    date_of_birth: 'null',
    phone: 'null',
    archived: 'keep',
    reminders: 'keep',
    push_notifications: 'keep',
    phone_requested: 'keep',
    created_at: 'keep',
}

const FAKE_STUDENT_COLUMNS: Record<string, string> = {
    name: `'Student ' || left(md5("id"), 6)`,
    email: `CASE WHEN "email" IS NULL THEN NULL ELSE 'student-' || left(md5("id"), 10) || '@example.test' END`,
}

export function anonymiseStatements(): string[] {
    const wipes = Object.entries(TABLE_POLICY)
        .filter(([, policy]) => policy === 'wipe')
        .map(([table]) => `DELETE FROM "${table}"`)

    const studentSets = Object.entries(STUDENT_COLUMN_POLICY)
        .filter(([, policy]) => policy !== 'keep')
        .map(([column, policy]) => `"${column}" = ${policy === 'null' ? 'NULL' : FAKE_STUDENT_COLUMNS[column]}`)

    return [
        ...wipes,
        `UPDATE "students" SET ${studentSets.join(', ')}`,
        `UPDATE "health" SET "injury" = CASE WHEN "injury" IS NULL THEN NULL ELSE 'Testblessure' END, "pregnancy" = false, "due_date" = NULL`,
    ]
}

export const VERIFY_QUERIES: { label: string; sql: string }[] = [
    { label: 'students with a real email address', sql: `SELECT count(*) AS n FROM "students" WHERE "email" IS NOT NULL AND "email" NOT LIKE '%@example.test'` },
    { label: 'students with a real name', sql: `SELECT count(*) AS n FROM "students" WHERE "name" NOT LIKE 'Student %'` },
    { label: 'students with phone, birth date or password', sql: `SELECT count(*) AS n FROM "students" WHERE "phone" IS NOT NULL OR "date_of_birth" IS NOT NULL OR "password_hash" IS NOT NULL` },
    { label: 'health rows with real details', sql: `SELECT count(*) AS n FROM "health" WHERE ("injury" IS NOT NULL AND "injury" <> 'Testblessure') OR "pregnancy" = true OR "due_date" IS NOT NULL` },
    ...Object.entries(TABLE_POLICY)
        .filter(([, policy]) => policy === 'wipe')
        .map(([table]) => ({ label: `rows left in ${table}`, sql: `SELECT count(*) AS n FROM "${table}"` })),
]

export async function verifyAnonymised(run: (sql: string) => Promise<{ n: number | string }[]>): Promise<string[]> {
    const failures: string[] = []
    for (const check of VERIFY_QUERIES) {
        const [row] = await run(check.sql)
        if (Number(row?.n ?? 0) > 0) failures.push(check.label)
    }
    return failures
}
```

- [ ] **Step 4: Run the tests**

Run: `yarn test:unit scripts/lib/anonymise.test.ts`
Expected: PASS. If a "has an explicit policy" case fails, the schema has a table that isn't listed. Stop and classify it: don't guess, and ask the user if it's unclear whether it holds personal data.

- [ ] **Step 5: Run the whole suite and commit**

Run: `yarn test:unit 2>&1 | tail -4`
Expected: PASS, 23 files.

```bash
git add scripts/lib/anonymise.ts scripts/lib/anonymise.test.ts
git commit -m "Add anonymisation policy for test database branches

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `yarn db:refresh-seed` and `yarn db:branch-url`

**Files:**
- Create: `scripts/neon-refresh-seed.ts`
- Create: `scripts/neon-branch-url.ts`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: `neonClientFromEnv`, `assertNotProductionUrl`, `NeonBranch` (Task 1); `anonymiseStatements`, `verifyAnonymised` (Task 2).
- Produces: Neon branches `seed` (anonymised child of `production`) and `dev` (child of `seed`), used by Tasks 5 and 6.

**Flow of `db:refresh-seed --yes`:**
1. Find `production`: it must be the primary branch.
2. Delete the existing `e2e-*` branches, then `dev`, then `seed`. Children go first, because Neon won't delete a branch that has children.
3. Create `seed` from `production`.
4. Check the connection with `assertNotProductionUrl`.
5. Run `anonymiseStatements()` in one transaction.
6. Run `verifyAnonymised`. If anything is left over, delete `seed` and exit 1.
7. Create `dev` from `seed`.

It refuses to run without `--yes`, because it throws away the current `dev` data.

- [ ] **Step 1: Write the refresh script**

`scripts/neon-refresh-seed.ts`:

```ts
/**
 * Rebuilds the anonymised `seed` branch from production, plus a fresh `dev` branch on top.
 * Deletes existing e2e-*, dev and seed branches first (dev data is lost).
 *
 * Usage: yarn db:refresh-seed --yes
 * Required env vars: NEON_API_KEY, NEON_PROJECT_ID
 */

import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { neonClientFromEnv, assertNotProductionUrl, type NeonBranch } from './lib/neon'
import { anonymiseStatements, verifyAnonymised } from './lib/anonymise'

async function main() {
    if (!process.argv.includes('--yes')) {
        console.error('This deletes the current seed, dev and e2e-* branches. Re-run with --yes to continue.')
        process.exit(1)
    }

    const neonClient = neonClientFromEnv()
    const branches = await neonClient.listBranches()
    const production = branches.find((b) => b.name === 'production')
    if (!production?.primary) {
        throw new Error('Expected a primary branch named "production"; aborting without changes')
    }

    const byName = (name: string) => branches.find((b) => b.name === name)
    const toDelete: NeonBranch[] = [
        ...branches.filter((b) => b.name.startsWith('e2e-')),
        ...[byName('dev'), byName('seed')].filter((b): b is NeonBranch => Boolean(b)),
    ]
    for (const branch of toDelete) {
        console.log(`Deleting branch ${branch.name}`)
        await neonClient.deleteBranch(branch)
    }

    console.log('Creating seed from production')
    const { branch: seed, connectionUri } = await neonClient.createBranch('seed', production.id)
    assertNotProductionUrl(connectionUri, await neonClient.productionHosts())

    const sql = neon(connectionUri)
    try {
        console.log('Anonymising seed')
        await sql.transaction(anonymiseStatements().map((statement) => sql.query(statement)))

        const failures = await verifyAnonymised((statement) => sql.query(statement) as Promise<{ n: number | string }[]>)
        if (failures.length > 0) {
            throw new Error(`Anonymisation incomplete: ${failures.join(', ')}`)
        }
    } catch (err) {
        console.error('Seed is not safe to use; deleting it')
        await neonClient.deleteBranch(seed)
        throw err
    }

    console.log('Creating dev from seed')
    await neonClient.createBranch('dev', seed.id)

    console.log('Done. Point your local .env at dev with: yarn -s db:branch-url dev | pbcopy')
}

main().catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
})
```

- [ ] **Step 2: Write the branch-URL script**

`scripts/neon-branch-url.ts`:

```ts
/**
 * Prints the connection string of a test branch (seed, dev or e2e-*) to stdout.
 * Pipe it instead of displaying it: yarn -s db:branch-url dev | pbcopy
 *
 * Required env vars: NEON_API_KEY, NEON_PROJECT_ID
 */

import 'dotenv/config'
import { neonClientFromEnv, assertSafeToModify } from './lib/neon'

async function main() {
    const name = process.argv[2]
    if (!name) throw new Error('Usage: yarn -s db:branch-url <seed|dev|e2e-...>')

    const neonClient = neonClientFromEnv()
    const branch = await neonClient.findBranch(name)
    if (!branch) throw new Error(`No branch named "${name}"`)
    assertSafeToModify(branch) // same allowlist: never hand out production credentials

    process.stdout.write(await neonClient.connectionUri(branch))
}

main().catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
})
```

- [ ] **Step 3: Add the package scripts**

In `package.json` `scripts`, after `"db:seed-lessons"`:

```json
    "db:refresh-seed": "tsx --tsconfig scripts/tsconfig.json scripts/neon-refresh-seed.ts",
    "db:branch-url": "tsx --tsconfig scripts/tsconfig.json scripts/neon-branch-url.ts",
```

- [ ] **Step 4: Check the guard without `--yes`**

Run: `yarn db:refresh-seed; echo "exit=$?"`
Expected: the "Re-run with --yes" message and `exit=1`. No Neon calls are made.

- [ ] **Step 5: Check that production credentials are never handed out**

Run: `yarn -s db:branch-url production > /dev/null; echo "exit=$?"`
Expected: `Refusing to modify Neon branch "production" …` and `exit=1`.

- [ ] **Step 6: STOP — confirm with the user before the first real refresh**

This is the first step that creates branches from production. Ask the user to confirm, then run:

Run: `yarn db:refresh-seed --yes`
Expected: `Creating seed from production` → `Anonymising seed` → `Creating dev from seed` → `Done.`, with exit 0.

- [ ] **Step 7: Independently check the result**

Use the Neon MCP `list_branches` for project `orange-shape-96414119`.
Expected: `production`, `seed` (parent: production) and `dev` (parent: seed).

Use the Neon MCP `run_sql` on the **seed** branch (by branch ID, never production):

```sql
SELECT
  (SELECT count(*) FROM students WHERE email IS NOT NULL AND email NOT LIKE '%@example.test') AS real_emails,
  (SELECT count(*) FROM students WHERE phone IS NOT NULL) AS phones,
  (SELECT count(*) FROM sessions) AS sessions,
  (SELECT count(*) FROM push_subscriptions) AS pushes,
  (SELECT count(*) FROM students) AS students,
  (SELECT count(*) FROM lessons) AS lessons
```

Expected: `real_emails`, `phones`, `sessions` and `pushes` are all 0; `students` and `lessons` match production's counts (compare with the same `count(*)` on production, which is read-only).

- [ ] **Step 8: Commit**

```bash
git add scripts/neon-refresh-seed.ts scripts/neon-branch-url.ts package.json
git commit -m "Add db:refresh-seed and db:branch-url for anonymised Neon branches

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: E2E fixtures, test-data seeding, and repaired specs

**Files:**
- Create: `e2e/fixtures.ts`
- Create: `scripts/lib/seed-e2e.ts`
- Create: `e2e/helpers.ts`
- Modify: `e2e/booking.spec.ts` (replace lines 16–74: imports, credentials, `login`, `logout`, `beforeEach`)
- Modify: `e2e/registration.spec.ts:106-114` (the `register` helper's entry)

**Interfaces:**
- Consumes: `server/database/schema.ts` tables.
- Produces:
  - `E2E_PASSWORD: string`, `E2E_STUDENT: { id, name, email }`, `E2E_ADMIN: { id, name, email }`, `E2E_LESSON_IDS: readonly ['e2e-lesson-1', 'e2e-lesson-2']`, `E2E_CREDITS: number`
  - `seedE2E(databaseUrl: string): Promise<void>`: idempotent upserts
  - `login(page: Page, email: string, password: string): Promise<void>` and `logout(page: Page): Promise<void>`

**Why the specs change:** `booking.spec.ts` still waits for an Appwrite `/v1/account/sessions` response and sets an `a_session_*` cookie. Neither exists since the move to Neon and cookie sessions (`rav_session`), so the spec can't pass today. `login.vue` is now passkey-first: password login sits behind "Andere manier gebruiken" → "Wachtwoord gebruiken". "Andere manier gebruiken" only appears when the browser supports passkeys; otherwise the options show directly.

- [ ] **Step 1: Write the fixtures**

`e2e/fixtures.ts`:

```ts
/** Test identities and data that scripts/lib/seed-e2e.ts creates on every e2e branch. */

export const E2E_PASSWORD = 'e2e-Wachtwoord-2026'

export const E2E_STUDENT = { id: 'e2e-student', name: 'E2E Student', email: 'e2e-student@example.test' } as const
export const E2E_ADMIN = { id: 'e2e-admin', name: 'E2E Admin', email: 'e2e-admin@example.test' } as const

export const E2E_LESSON_IDS = ['e2e-lesson-1', 'e2e-lesson-2'] as const
export const E2E_CREDITS = 5
```

- [ ] **Step 2: Write the seeding module**

`scripts/lib/seed-e2e.ts`:

```ts
import bcrypt from 'bcryptjs'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq, inArray } from 'drizzle-orm'
import * as schema from '../../server/database/schema'
import { E2E_PASSWORD, E2E_STUDENT, E2E_ADMIN, E2E_LESSON_IDS, E2E_CREDITS } from '../../e2e/fixtures'

const DAY = 24 * 60 * 60 * 1000

/**
 * Makes an e2e branch predictable: a student with free credits, an admin, and
 * two future lessons with free spots. Safe to run repeatedly.
 */
export async function seedE2E(databaseUrl: string): Promise<void> {
    const db = drizzle(neon(databaseUrl), { schema })
    const passwordHash = await bcrypt.hash(E2E_PASSWORD, 10)
    const now = new Date()

    for (const user of [{ ...E2E_STUDENT, isAdmin: false }, { ...E2E_ADMIN, isAdmin: true }]) {
        const values = { name: user.name, email: user.email, passwordHash, isAdmin: user.isAdmin, emailVerified: true, archived: false, phoneRequested: true }
        await db.insert(schema.students)
            .values({ id: user.id, ...values })
            .onConflictDoUpdate({ target: schema.students.id, set: values })
    }

    for (const [index, id] of E2E_LESSON_IDS.entries()) {
        const date = new Date(now.getTime() + (3 + index * 7) * DAY)
        await db.insert(schema.lessons)
            .values({ id, date, type: 'hatha yoga', teacher: 'Ravennah', maxSpots: 9 })
            .onConflictDoUpdate({ target: schema.lessons.id, set: { date, maxSpots: 9 } })
    }
    // Empty the seeded lessons. Credits reference bookings (no cascade), so release them first.
    const seededBookings = db.select({ id: schema.bookings.id }).from(schema.bookings)
        .where(inArray(schema.bookings.lessonId, [...E2E_LESSON_IDS]))
    await db.update(schema.credits).set({ bookingId: null, usedAt: null })
        .where(inArray(schema.credits.bookingId, seededBookings))
    await db.delete(schema.bookings).where(inArray(schema.bookings.lessonId, [...E2E_LESSON_IDS]))

    // Fresh, unused credits for the student
    await db.delete(schema.credits).where(eq(schema.credits.studentId, E2E_STUDENT.id))
    await db.insert(schema.credits).values(
        Array.from({ length: E2E_CREDITS }, (_, i) => ({
            id: `e2e-credit-${i + 1}`,
            studentId: E2E_STUDENT.id,
            bookingId: null,
            type: 'credit_5' as const,
            validFrom: now,
            validTo: new Date(now.getTime() + 180 * DAY),
            createdAt: now,
            usedAt: null,
        }))
    )
}
```

- [ ] **Step 3: Write the shared login helpers**

`e2e/helpers.ts`:

```ts
import { Page, expect } from '@playwright/test'

/** Password login through the passkey-first login page. */
export async function login(page: Page, email: string, password: string) {
    await page.goto('/login')

    const otherOptions = page.getByRole('button', { name: 'Andere manier gebruiken' })
    const usePassword = page.getByRole('button', { name: 'Wachtwoord gebruiken' })
    await expect(otherOptions.or(usePassword).first()).toBeVisible({ timeout: 10_000 })
    if (await otherOptions.isVisible()) await otherOptions.click()
    await usePassword.click()

    await page.fill('#email', email)
    await page.fill('#password', password)
    await page.getByRole('button', { name: 'Inloggen', exact: true }).click()
    await page.waitForURL('**/account', { timeout: 15_000 })
}

export async function logout(page: Page) {
    await page.locator('nav').getByText('Logout', { exact: true }).click()
    await page.waitForURL('**/', { timeout: 10_000 })
}
```

- [ ] **Step 4: Point `booking.spec.ts` at the helpers and fixtures**

Replace everything in `e2e/booking.spec.ts` from the top of the file up to and including the `test.beforeEach(() => { … })` block (the Appwrite-era header, credentials, `login`, `logout` and `navigateToLessen`) with:

```ts
/**
 * E2E test: Login and book a lesson.
 *
 * Run against a throwaway Neon branch (recommended): yarn test:e2e:branch
 * Credentials default to the seeded e2e student; override with TEST_EMAIL / TEST_PASSWORD.
 */

import { test, expect, Page } from '@playwright/test'
import { E2E_PASSWORD, E2E_STUDENT } from './fixtures'
import { login as loginAs, logout } from './helpers'

const email = process.env.TEST_EMAIL ?? E2E_STUDENT.email
const password = process.env.TEST_PASSWORD ?? E2E_PASSWORD

const login = (page: Page) => loginAs(page, email, password)
```

Keep everything from `test.describe('Authentication', …` onwards. `navigateToLessen` is unused, so it goes with the replaced block; confirm with `grep -n navigateToLessen e2e/booking.spec.ts` (expected: no matches).

- [ ] **Step 5: Fix the register entry in `registration.spec.ts`**

Replace the first lines of `async function register(page: Page, user: TestUser)`, from `await page.goto('/login')` through `await page.waitForSelector('#name')`, with:

```ts
    await page.goto('/login')

    // Switch to register form ("Nog geen account? Registreren")
    await page.getByRole('button', { name: /Registreren/ }).first().click()

    // Wait for register form fields
    await page.waitForSelector('#name')
```

- [ ] **Step 6: Check it compiles**

Run: `yarn playwright test --list 2>&1 | tail -6`
Expected: the test list (Authentication, Booking flow, Registration flow ×2) and no TypeScript or import errors.

- [ ] **Step 7: Commit**

(The seeding and specs are exercised end-to-end in Task 5.)

```bash
git add e2e/fixtures.ts e2e/helpers.ts e2e/booking.spec.ts e2e/registration.spec.ts scripts/lib/seed-e2e.ts
git commit -m "Seed predictable e2e data and repair specs for cookie sessions and passkey-first login

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: `yarn test:e2e:branch` runner

**Files:**
- Create: `scripts/lib/e2e-runner.ts`
- Test: `scripts/lib/e2e-runner.test.ts`
- Create: `scripts/e2e-branch.ts`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: `neonClientFromEnv`, `assertNotProductionUrl`, `NeonBranch` (Task 1); `seedE2E`, `E2E_LESSON_IDS`, `E2E_STUDENT`, `E2E_PASSWORD` (Task 4).
- Produces:
  - `e2eBranchName(now: Date): string`, e.g. `e2e-20260924-101500`
  - `staleE2EBranches(branches: NeonBranch[]): NeonBranch[]`: every `e2e-*` branch
  - `isServingTestBranch(lessonsJson: unknown): boolean`: true only if `rows` contains `E2E_LESSON_IDS[0]`

**Flow:**
1. Delete leftover `e2e-*` branches.
2. Create `e2e-<ts>` from `seed`.
3. Check the connection with `assertNotProductionUrl`.
4. Run `seedE2E`.
5. Start `nuxt dev --port 3100` with `NUXT_DATABASE_URL` set to the branch and `NODE_ENV=development` (so mail goes to Mailtrap).
6. Poll `GET /api/lessons` until `isServingTestBranch` (timeout 180 s), otherwise abort.
7. Run `playwright test`, passing through any extra CLI args, with `BASE_URL`, `TEST_EMAIL` and `TEST_PASSWORD` set.
8. In `finally` (and on SIGINT/SIGTERM): stop the dev server, then delete the branch unless `--keep` was passed.
9. Exit with Playwright's exit code.

- [ ] **Step 1: Write the failing tests**

`scripts/lib/e2e-runner.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { e2eBranchName, staleE2EBranches, isServingTestBranch } from './e2e-runner'

describe('e2eBranchName', () => {
    it('is e2e- plus a sortable UTC timestamp', () => {
        expect(e2eBranchName(new Date('2026-09-24T10:15:00Z'))).toBe('e2e-20260924-101500')
    })
})

describe('staleE2EBranches', () => {
    it('selects only e2e-* branches', () => {
        const branches = [
            { id: '1', name: 'production', primary: true },
            { id: '2', name: 'seed' },
            { id: '3', name: 'dev' },
            { id: '4', name: 'e2e-20260923-080000' },
            { id: '5', name: 'e2e-20260924-090000' },
        ]
        expect(staleE2EBranches(branches).map((b) => b.id)).toEqual(['4', '5'])
    })
})

describe('isServingTestBranch', () => {
    it('is true when the seeded lesson is served', () => {
        expect(isServingTestBranch({ rows: [{ $id: 'real-lesson' }, { $id: 'e2e-lesson-1' }] })).toBe(true)
    })

    it('is false for production-like data without the seeded lesson', () => {
        expect(isServingTestBranch({ rows: [{ $id: 'real-lesson' }] })).toBe(false)
    })

    it.each([null, undefined, 'Server Error', {}, { rows: 'x' }])('is false for unexpected body %j', (body) => {
        expect(isServingTestBranch(body)).toBe(false)
    })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn test:unit scripts/lib/e2e-runner.test.ts`
Expected: FAIL, `Failed to load url ./e2e-runner`.

- [ ] **Step 3: Implement the helpers**

`scripts/lib/e2e-runner.ts`:

```ts
import type { NeonBranch } from './neon'
import { E2E_LESSON_IDS } from '../../e2e/fixtures'

export function e2eBranchName(now: Date): string {
    const stamp = now.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15)
    return `e2e-${stamp}`
}

/** Local runs are sequential, so any e2e-* branch at start-up is a leftover from a crashed run. */
export function staleE2EBranches(branches: NeonBranch[]): NeonBranch[] {
    return branches.filter((b) => b.name.startsWith('e2e-'))
}

/** Proves the app is connected to the seeded test branch, not to production. */
export function isServingTestBranch(lessonsJson: unknown): boolean {
    const rows = (lessonsJson as { rows?: unknown } | null | undefined)?.rows
    return Array.isArray(rows) && rows.some((row) => (row as { $id?: string })?.$id === E2E_LESSON_IDS[0])
}
```

- [ ] **Step 4: Run the helper tests**

Run: `yarn test:unit scripts/lib/e2e-runner.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Write the runner**

`scripts/e2e-branch.ts`:

```ts
/**
 * Runs the Playwright suite against a throwaway Neon branch of the anonymised seed.
 *
 * Usage:
 *   yarn test:e2e:branch                    # all specs, branch deleted afterwards
 *   yarn test:e2e:branch e2e/booking.spec.ts --headed
 *   yarn test:e2e:branch --keep             # keep the branch for debugging
 *
 * Required env vars: NEON_API_KEY, NEON_PROJECT_ID (and a `seed` branch: yarn db:refresh-seed --yes)
 */

import 'dotenv/config'
import { spawn, type ChildProcess } from 'node:child_process'
import { neonClientFromEnv, assertNotProductionUrl, type NeonBranch } from './lib/neon'
import { e2eBranchName, staleE2EBranches, isServingTestBranch } from './lib/e2e-runner'
import { seedE2E } from './lib/seed-e2e'
import { E2E_STUDENT, E2E_PASSWORD } from '../e2e/fixtures'

const PORT = 3100
const BASE_URL = `http://localhost:${PORT}`
const READY_TIMEOUT_MS = 180_000

const args = process.argv.slice(2)
const keepBranch = args.includes('--keep')
const playwrightArgs = args.filter((a) => a !== '--keep')

const neonClient = neonClientFromEnv()
let branch: NeonBranch | undefined
let devServer: ChildProcess | undefined
let cleanedUp = false

async function cleanup() {
    if (cleanedUp) return
    cleanedUp = true
    // The server runs in its own process group (detached), so kill the group: yarn + nuxt + workers
    if (devServer?.pid && devServer.exitCode === null) {
        try { process.kill(-devServer.pid, 'SIGTERM') } catch { /* already gone */ }
    }
    if (branch && !keepBranch) {
        console.log(`Deleting branch ${branch.name}`)
        await neonClient.deleteBranch(branch).catch((err) => console.error('Branch cleanup failed:', err.message))
    } else if (branch) {
        console.log(`Keeping branch ${branch.name} (yarn -s db:branch-url ${branch.name} | pbcopy)`)
    }
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => { cleanup().finally(() => process.exit(130)) })
}

async function waitForTestBranch() {
    const deadline = Date.now() + READY_TIMEOUT_MS
    while (Date.now() < deadline) {
        if (devServer?.exitCode !== null) throw new Error('Dev server exited before it was ready')
        // Only a 200 is decisive: while Nuxt boots, it answers with errors or HTML
        const body = await fetch(`${BASE_URL}/api/lessons`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        if (isServingTestBranch(body)) return
        if (body) throw new Error('Dev server is up but NOT serving the e2e branch (seeded lesson missing) — refusing to run tests')
        await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    throw new Error(`Dev server not ready after ${READY_TIMEOUT_MS / 1000}s`)
}

function run(command: string, commandArgs: string[], env: NodeJS.ProcessEnv): Promise<number> {
    return new Promise((resolve) => {
        const child = spawn(command, commandArgs, { stdio: 'inherit', env })
        child.on('exit', (code) => resolve(code ?? 1))
    })
}

async function main(): Promise<number> {
    const branches = await neonClient.listBranches()
    const seed = branches.find((b) => b.name === 'seed')
    if (!seed) throw new Error('No seed branch. Create it first: yarn db:refresh-seed --yes')

    for (const stale of staleE2EBranches(branches)) {
        console.log(`Deleting leftover branch ${stale.name}`)
        await neonClient.deleteBranch(stale)
    }

    const created = await neonClient.createBranch(e2eBranchName(new Date()), seed.id)
    branch = created.branch
    assertNotProductionUrl(created.connectionUri, await neonClient.productionHosts())
    console.log(`Created branch ${branch.name}; seeding test data`)
    await seedE2E(created.connectionUri)

    const appEnv = { ...process.env, NUXT_DATABASE_URL: created.connectionUri, NODE_ENV: 'development' }
    devServer = spawn('yarn', ['nuxt', 'dev', '--port', String(PORT)], { stdio: ['ignore', 'ignore', 'inherit'], env: appEnv, detached: true })
    console.log(`Starting dev server on ${BASE_URL}`)
    await waitForTestBranch()

    return run('yarn', ['playwright', 'test', ...playwrightArgs], {
        ...process.env,
        BASE_URL,
        TEST_EMAIL: E2E_STUDENT.email,
        TEST_PASSWORD: E2E_PASSWORD,
    })
}

main()
    .then(async (code) => { await cleanup(); process.exit(code) })
    .catch(async (err) => {
        console.error(err instanceof Error ? err.message : err)
        await cleanup()
        process.exit(1)
    })
```

- [ ] **Step 6: Add the package script**

In `package.json` `scripts`, after `"test:e2e:headed"`:

```json
    "test:e2e:branch": "tsx --tsconfig scripts/tsconfig.json scripts/e2e-branch.ts",
```

- [ ] **Step 7: Run the whole E2E suite on a branch**

Requires Task 3 to have created `seed`, and the Playwright browser to be installed (`yarn dlx playwright install chromium` if it's missing).

Run: `yarn test:e2e:branch`
Expected:
- `Created branch e2e-…; seeding test data` → `Starting dev server on http://localhost:3100` → the Playwright report with **4 passed** (Authentication, Booking flow, Registration ×2) → `Deleting branch e2e-…`, exit 0.
- The booking test must not be skipped: it needs the 5 seeded credits.

If a spec fails on a selector, fix the spec. Don't loosen the runner's production guard, and ledger any selector changes.

- [ ] **Step 8: Verify cleanup and the guard**

Use the Neon MCP `list_branches`.
Expected: only `production`, `seed` and `dev`. No `e2e-*` left.

Run `yarn test:e2e:branch e2e/booking.spec.ts` and send SIGINT while it says `Starting dev server` (in a second shell: `pkill -INT -f scripts/e2e-branch.ts`).
Expected: `Deleting branch e2e-…` is printed and the process exits 130. `list_branches` shows no `e2e-*`, and `lsof -iTCP:3100 -sTCP:LISTEN` prints nothing (no orphaned dev server).

- [ ] **Step 9: Run the unit suite and commit**

Run: `yarn test:unit 2>&1 | tail -4`
Expected: PASS, 24 files.

```bash
git add scripts/lib/e2e-runner.ts scripts/lib/e2e-runner.test.ts scripts/e2e-branch.ts package.json
git commit -m "Add test:e2e:branch runner on throwaway Neon branches

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Point local dev at `dev`, and document the workflow

**Files:**
- Modify: `CLAUDE.md` (E2E Tests and Database Scripts sections)
- User action: `.env`

- [ ] **Step 1: The user switches local `.env` to the `dev` branch**

The user runs `! yarn -s db:branch-url dev | pbcopy` and replaces the value of `NUXT_DATABASE_URL` in `.env` with the clipboard contents. The executor doesn't edit `.env` and doesn't display the value.

Then the executor verifies without printing the secret:

Run: `grep '^NUXT_DATABASE_URL' .env | sed -E 's#.*@([^/:?]+).*#\1#'`
Expected: a host that is **not** `ep-empty-resonance-agcehj7b-pooler…` (the production endpoint).

- [ ] **Step 2: Update CLAUDE.md**

Replace the `### E2E Tests (Playwright)` section's code block and the sentence after it with:

````markdown
```bash
yarn test:e2e:branch                              # recommended: fresh Neon branch of the anonymised seed, deleted afterwards
yarn test:e2e:branch e2e/booking.spec.ts --headed # one spec, visible browser
yarn test:e2e:branch --keep                       # keep the branch to debug (yarn -s db:branch-url <name> | pbcopy)
BASE_URL=http://localhost:3000 yarn test:e2e      # run against an already-running server (uses TEST_EMAIL/TEST_PASSWORD or the seeded e2e user)
```

Tests are in `e2e/`. Test users and lessons are seeded on every e2e branch from `e2e/fixtures.ts` (`scripts/lib/seed-e2e.ts`). Requires `NEON_API_KEY` and `NEON_PROJECT_ID` in `.env` and Playwright browsers (`yarn dlx playwright install chromium`).
````

In `### Database Scripts`, add below the `db:seed-lessons` block:

````markdown
Neon branches (project `orange-shape-96414119`): `production` (live — never point local `.env` at it), `seed` (anonymised copy of production), `dev` (local development, child of seed), `e2e-*` (throwaway, one per test run).

```bash
yarn db:refresh-seed --yes          # rebuild seed from production (anonymised) + fresh dev; deletes old seed/dev/e2e-*
yarn -s db:branch-url dev | pbcopy  # connection string for a test branch (never printed, never production)
```

When a table or a `students` column is added to `server/database/schema.ts`, classify it in `scripts/lib/anonymise.ts` — the unit tests fail until you do.
````

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "Document Neon branch workflow for local dev and E2E

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Out of scope (noted during planning)

- **CI** (the user chose local only). Also, `.github/workflows/ci.yml` triggers on `branches: [main]` while the default branch is `master`, so unit tests never run on PRs. That's a one-word fix, worth doing separately.
- **Mailtrap credentials:** dev SMTP reads `config.mailUserDev` / `config.mailPassDev`, but `.env` has no `NUXT_MAIL_USER_DEV` / `NUXT_MAIL_PASS_DEV`. In dev, emails fail and the failure is logged, which is harmless for these tests, since `@example.test` addresses can't be delivered anyway.
- **Testing pending Drizzle migrations** on a branch before production: use the Neon MCP `prepare_database_migration` when a migration comes up.
