# `yarn dev` on the Neon `dev` Branch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `yarn dev` (and the local database tools) always run against the anonymised Neon `dev` branch, and no local file holds the production connection string any more.

**Architecture:** A wrapper `scripts/with-dev-db.ts <command…>` does three things:
1. It asks the Neon API for the `dev` branch's connection string, through one shared guarded helper `safeConnectionUri(name)` in `scripts/lib/neon.ts` (also used by `db:branch-url`).
2. It runs the command with `NUXT_DATABASE_URL` set to that string, and with the Neon API credentials removed from the child's environment.
3. If Neon can't be reached, it fails. It never falls back to a URL in `.env`.

Nuxt's env loader (c12) doesn't override a variable that is already set, so the wrapper's value wins over `.env`.

**Tech Stack:** Node 20 `fetch` + `child_process`, `tsx`, Vitest. No new dependencies.

**Spec:** No separate spec doc. This plan implements the 2026-09-24 session agreement: `yarn dev` must use the `dev` branch, and `NUXT_DATABASE_URL` is removed from local `.env`. Production (DigitalOcean App Platform) gets `NUXT_DATABASE_URL` from its own app environment variable and builds and runs with `yarn build` / `yarn start`. Neither of those is touched here.

## Global Constraints

- Build on branch `feature/neon-branch-e2e` (PR #273). This plan depends on its `scripts/lib/neon.ts`.
- **Never fall back to `.env`'s `NUXT_DATABASE_URL`.** No Neon answer means no dev server.
- **Never hand out production credentials:** the branch-name allowlist (`assertSafeToModify`) plus the host check (`assertNotProductionUrl`).
- Only wrap `dev`, `preview`, `db:push` and `db:studio`. Leave `build`, `start` and `generate` unchanged: production runs them. Leave `db:generate` unchanged too: it only diffs `schema.ts` against `drizzle/`, with no database connection.
- Secrets are never printed. The wrapper logs only the branch name.
- Unit tests: `yarn test:unit`. Baseline: **24 files, 250 tests**.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Neon is unreachable** (offline, API outage, bad key). `yarn dev` must exit with a clear message and must not start Nuxt on whatever `.env` holds. Pinned in Task 1 (`safeConnectionUri` rejects when the API fails) and Task 2 (the wrapper exits non-zero without spawning).
2. **`dev` doesn't exist** (never created, or mid-refresh). The error must say to run `yarn db:refresh-seed --yes`. Pinned in Task 1.
3. **The name or host resolves to production.** Refused before any connection string is fetched or returned. Pinned in Task 1.
4. **Ctrl-C in `yarn dev`** stops Nuxt, the wrapper exits with Nuxt's status, and no orphan keeps port 3000. Checked manually in Task 2, Step 7.
5. **`NEON_API_KEY` must not reach the Nuxt process**, where it could leak into logs or runtime config. Pinned in Task 2 (`devCommandEnv` tests).

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `scripts/lib/neon.ts` | Modify | Add client method `safeConnectionUri(name)` |
| `scripts/lib/neon.test.ts` | Modify | Tests for `safeConnectionUri` |
| `scripts/neon-branch-url.ts` | Modify | Use `safeConnectionUri` (removes duplicate logic) |
| `scripts/lib/dev-db.ts` | Create | `devCommandEnv(env, url)`: child environment for the wrapped command |
| `scripts/lib/dev-db.test.ts` | Create | Tests for `devCommandEnv` |
| `scripts/with-dev-db.ts` | Create | The wrapper: resolve `dev`, run the command, forward the exit code |
| `package.json` | Modify | `dev`, `preview`, `db:push`, `db:studio` go through the wrapper |
| `CLAUDE.md` | Modify | Document it; runtime-config note |
| `.env` | User action | Remove the `NUXT_DATABASE_URL` line |

---

### Task 1: Shared guarded connection-string helper

**Files:**
- Modify: `scripts/lib/neon.ts` (new method in the object returned by `createNeonClient`, after `connectionUri`)
- Modify: `scripts/lib/neon.test.ts` (append a `describe`)
- Modify: `scripts/neon-branch-url.ts` (the body of `main`)

**Interfaces:**
- Consumes: `assertSafeToModify`, `assertNotProductionUrl`, and the client methods `findBranch`, `connectionUri` and `productionHosts` (all existing).
- Produces: `client.safeConnectionUri(name: string): Promise<string>`.
  - It throws `No Neon branch named "<name>". Create it with: yarn db:refresh-seed --yes` when the branch is missing.
  - It throws `Refusing…` for production-like names or flags. That check runs before fetching any connection string.
  - It throws when the resolved host is a production host.

- [ ] **Step 1: Write the failing tests**

Append to `scripts/lib/neon.test.ts`:

```ts
describe('safeConnectionUri', () => {
    const dev: NeonBranch = { id: 'br-dev', name: 'dev', parent_id: 'br-seed' }
    const devRoutes = {
        'GET /branches': { branches: [production, seed, dev] },
        'GET /branches/br-dev/databases': { databases: [{ name: 'neondb', owner_name: 'neondb_owner' }] },
        'GET /connection_uri?branch_id=br-dev&database_name=neondb&role_name=neondb_owner': { uri: 'postgresql://u:p@ep-dev.neon.tech/neondb' },
        'GET /branches/br-prod/endpoints': { endpoints: [{ host: 'ep-prod.neon.tech' }] },
    }

    it('returns the connection string of a test branch', async () => {
        const client = createNeonClient({ apiKey: 'k', projectId: 'proj-1', fetch: fakeFetch(devRoutes) })
        await expect(client.safeConnectionUri('dev')).resolves.toBe('postgresql://u:p@ep-dev.neon.tech/neondb')
    })

    it('tells you how to create a missing branch', async () => {
        const client = createNeonClient({ apiKey: 'k', projectId: 'proj-1', fetch: fakeFetch({ 'GET /branches': { branches: [production] } }) })
        await expect(client.safeConnectionUri('dev')).rejects.toThrow('No Neon branch named "dev". Create it with: yarn db:refresh-seed --yes')
    })

    it('refuses production before fetching any connection string', async () => {
        const fetch = fakeFetch(devRoutes)
        const client = createNeonClient({ apiKey: 'k', projectId: 'proj-1', fetch })

        await expect(client.safeConnectionUri('production')).rejects.toThrow(/Refusing/)
        expect(fetch.mock.calls.map((c) => c[0])).not.toContainEqual(expect.stringContaining('connection_uri'))
    })

    it('refuses a test branch whose host is a production endpoint', async () => {
        const client = createNeonClient({
            apiKey: 'k', projectId: 'proj-1',
            fetch: fakeFetch({ ...devRoutes, 'GET /branches/br-prod/endpoints': { endpoints: [{ host: 'ep-dev.neon.tech' }] } }),
        })
        await expect(client.safeConnectionUri('dev')).rejects.toThrow(/production/)
    })

    it('fails when the Neon API is unreachable', async () => {
        const fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'))
        const client = createNeonClient({ apiKey: 'k', projectId: 'proj-1', fetch })
        await expect(client.safeConnectionUri('dev')).rejects.toThrow('fetch failed')
    })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn test:unit scripts/lib/neon.test.ts`
Expected: the 5 new tests FAIL with `client.safeConnectionUri is not a function`.

- [ ] **Step 3: Implement**

In `scripts/lib/neon.ts`, inside the object returned by `createNeonClient`, directly after the `connectionUri` method, add:

```ts
        /** Connection string of a test branch (seed, dev, e2e-*) — never of production. */
        async safeConnectionUri(name: string) {
            const branch = (await listBranches()).find((b) => b.name === name)
            if (!branch) throw new Error(`No Neon branch named "${name}". Create it with: yarn db:refresh-seed --yes`)
            assertSafeToModify(branch)
            const uri = await this.connectionUri(branch)
            assertNotProductionUrl(uri, await this.productionHosts())
            return uri
        },
```

- [ ] **Step 4: Run the tests**

Run: `yarn test:unit scripts/lib/neon.test.ts`
Expected: PASS (28 tests: 23 existing + 5 new).

- [ ] **Step 5: Use it in `db:branch-url`**

In `scripts/neon-branch-url.ts`:
- Replace the import line with `import { neonClientFromEnv } from './lib/neon'`.
- Replace the four lines from `const neonClient = neonClientFromEnv()` through `process.stdout.write(await neonClient.connectionUri(branch))` with:

```ts
    process.stdout.write(await neonClientFromEnv().safeConnectionUri(name))
```

Run: `yarn -s db:branch-url production > /dev/null; echo "exit=$?"`
Expected: `Refusing to modify Neon branch "production" …` and `exit=1`.

Run: `yarn -s db:branch-url dev | wc -c`
Expected: a number above 50 (the string went into the pipe, not onto the screen).

- [ ] **Step 6: Run the whole suite and commit**

Run: `yarn test:unit 2>&1 | tail -4`
Expected: 24 files, 255 tests passing.

```bash
git add scripts/lib/neon.ts scripts/lib/neon.test.ts scripts/neon-branch-url.ts
git commit -m "Add guarded safeConnectionUri for test branches

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `with-dev-db` wrapper for `yarn dev` and the database tools

**Files:**
- Create: `scripts/lib/dev-db.ts`
- Test: `scripts/lib/dev-db.test.ts`
- Create: `scripts/with-dev-db.ts`
- Modify: `package.json` (`dev`, `preview`, `db:push`, `db:studio`)

**Interfaces:**
- Consumes: `neonClientFromEnv().safeConnectionUri('dev')` (Task 1).
- Produces:
  - `DEV_BRANCH = 'dev'`
  - `devCommandEnv(env: NodeJS.ProcessEnv, databaseUrl: string): NodeJS.ProcessEnv`: a copy of `env` with `NUXT_DATABASE_URL` set to `databaseUrl`, and `NEON_API_KEY` / `NEON_PROJECT_ID` removed

- [ ] **Step 1: Write the failing tests**

`scripts/lib/dev-db.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { devCommandEnv } from './dev-db'

describe('devCommandEnv', () => {
    const env = {
        PATH: '/usr/bin',
        NUXT_DATABASE_URL: 'postgresql://prod-from-dotenv',
        NUXT_SESSION_SECRET: 'secret',
        NEON_API_KEY: 'napi_key',
        NEON_PROJECT_ID: 'proj-1',
    }

    it('points the app at the given branch, overriding .env', () => {
        expect(devCommandEnv(env, 'postgresql://dev-branch').NUXT_DATABASE_URL).toBe('postgresql://dev-branch')
    })

    it('keeps the rest of the environment the app needs', () => {
        expect(devCommandEnv(env, 'postgresql://dev-branch')).toMatchObject({ PATH: '/usr/bin', NUXT_SESSION_SECRET: 'secret' })
    })

    it('does not pass the Neon API credentials to the app', () => {
        const result = devCommandEnv(env, 'postgresql://dev-branch')
        expect(result).not.toHaveProperty('NEON_API_KEY')
        expect(result).not.toHaveProperty('NEON_PROJECT_ID')
    })

    it('does not modify the environment it was given', () => {
        devCommandEnv(env, 'postgresql://dev-branch')
        expect(env.NUXT_DATABASE_URL).toBe('postgresql://prod-from-dotenv')
        expect(env.NEON_API_KEY).toBe('napi_key')
    })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn test:unit scripts/lib/dev-db.test.ts`
Expected: FAIL, `Failed to load url ./dev-db`.

- [ ] **Step 3: Implement the helper**

`scripts/lib/dev-db.ts`:

```ts
export const DEV_BRANCH = 'dev'

/** Environment for a command run against a Neon test branch: its database, without Neon API credentials. */
export function devCommandEnv(env: NodeJS.ProcessEnv, databaseUrl: string): NodeJS.ProcessEnv {
    const { NEON_API_KEY: _key, NEON_PROJECT_ID: _project, ...rest } = env
    return { ...rest, NUXT_DATABASE_URL: databaseUrl }
}
```

- [ ] **Step 4: Run the tests**

Run: `yarn test:unit scripts/lib/dev-db.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Write the wrapper**

`scripts/with-dev-db.ts`:

```ts
/**
 * Runs a command against the Neon `dev` branch instead of any database URL in .env.
 *
 * Usage (via package.json): yarn dev, yarn preview, yarn db:push, yarn db:studio
 *   tsx scripts/with-dev-db.ts <command> [args...]
 *
 * Never falls back to .env: if Neon can't be reached, nothing starts.
 * Required env vars: NEON_API_KEY, NEON_PROJECT_ID
 */

import 'dotenv/config'
import { spawn } from 'node:child_process'
import { neonClientFromEnv } from './lib/neon'
import { DEV_BRANCH, devCommandEnv } from './lib/dev-db'

async function main() {
    const [command, ...args] = process.argv.slice(2)
    if (!command) throw new Error('Usage: tsx scripts/with-dev-db.ts <command> [args...]')

    const databaseUrl = await neonClientFromEnv().safeConnectionUri(DEV_BRANCH)
    console.log(`Using Neon branch "${DEV_BRANCH}"`)

    // Not detached: interactive tools (drizzle-kit push prompts) need the terminal.
    const child = spawn('yarn', ['-s', command, ...args], { stdio: 'inherit', env: devCommandEnv(process.env, databaseUrl) })

    // Forward signals and wait for the child to finish, so we never leave an orphaned server behind.
    // (On terminal Ctrl-C the child also gets the signal directly; a second one is harmless.)
    for (const signal of ['SIGINT', 'SIGTERM'] as const) {
        process.on(signal, () => { if (child.exitCode === null) child.kill(signal) })
    }
    child.on('exit', (code, signal) => process.exit(code ?? (signal ? 130 : 1)))
}

main().catch((err) => {
    console.error(`Not starting: ${err instanceof Error ? err.message : err}`)
    process.exit(1)
})
```

- [ ] **Step 6: Route the scripts through the wrapper**

In `package.json` `scripts`, change these four entries (leave all others as they are):

```json
    "dev": "tsx --tsconfig scripts/tsconfig.json scripts/with-dev-db.ts nuxt dev",
    "preview": "tsx --tsconfig scripts/tsconfig.json scripts/with-dev-db.ts nuxt preview",
    "db:push": "tsx --tsconfig scripts/tsconfig.json scripts/with-dev-db.ts drizzle-kit push",
    "db:studio": "tsx --tsconfig scripts/tsconfig.json scripts/with-dev-db.ts drizzle-kit studio",
```

- [ ] **Step 7: Prove `yarn dev` serves the dev branch, and Ctrl-C is clean**

1. Use the Neon MCP `run_sql` on the **dev** branch (look up its ID with `list_branches`; never production) to insert a marker lesson:
   `INSERT INTO lessons (id, date, type, teacher, max_spots) VALUES ('dev-branch-marker', now() + interval '30 days', 'hatha yoga', 'Marker', 9)`
2. Run `yarn dev` in the background (log to a scratch file) and wait for the Nitro "built" line.
   Expected: the log shows `Using Neon branch "dev"` and no connection string.
3. Run: `curl -s localhost:3000/api/lessons | grep -c dev-branch-marker`
   Expected: `1`. Production doesn't have this lesson, so this proves the app is on `dev`, even though `.env` still holds the production URL at this point.
4. Send SIGINT to the wrapper process only (`pkill -INT -f scripts/with-dev-db.ts`), then run `lsof -iTCP:3000 -sTCP:LISTEN`.
   Expected: the wrapper has exited and nothing is listening on :3000, which shows the wrapper forwarded the signal. If Nuxt survives because the `yarn` in between doesn't pass the signal on, record a ruling and switch the spawn to run the local binary directly (`node_modules/.bin/<command>`) instead of through `yarn -s`.
5. Use the Neon MCP `run_sql` on the dev branch: `DELETE FROM lessons WHERE id = 'dev-branch-marker'`.
   Expected: 1 row deleted.

- [ ] **Step 8: Prove it never falls back to `.env`**

Run: `NEON_API_KEY=invalid yarn -s dev; echo "exit=$?"`
Expected: `Not starting: Neon API GET /branches failed with 401 …`, `exit=1`, and Nuxt never starts (no "Nuxt" banner in the output).

- [ ] **Step 9: Run the whole suite and commit**

Run: `yarn test:unit 2>&1 | tail -4`
Expected: 25 files, 259 tests passing.

```bash
git add scripts/lib/dev-db.ts scripts/lib/dev-db.test.ts scripts/with-dev-db.ts package.json
git commit -m "Run yarn dev and local db tools on the Neon dev branch

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Remove the production URL locally, and document it

**Files:**
- User action: `.env`
- Modify: `CLAUDE.md` (Build & Dev Commands, Database Scripts, Runtime Config)

- [ ] **Step 1: The user removes the production URL from `.env`**

The user deletes the `NUXT_DATABASE_URL=…` line from `.env`. The executor does not edit `.env`. Production is unaffected: DigitalOcean App Platform sets its own `NUXT_DATABASE_URL`.

Then the executor verifies without printing anything secret:

Run: `grep -c '^NUXT_DATABASE_URL' .env`
Expected: `0`

Run: `yarn -s dev` in the background. Once it's built, run `curl -s -o /dev/null -w "%{http_code}" localhost:3000/api/lessons`, then stop it with SIGINT.
Expected: `200`, served from the dev branch with no database URL anywhere in `.env`.

- [ ] **Step 2: Update CLAUDE.md**

In `## Build & Dev Commands`, replace the line `yarn dev        # Dev server on localhost:3000` with:

```
yarn dev        # Dev server on localhost:3000, always on the Neon `dev` branch (never production)
```

and add this below the code block's closing fence, before `No linter is configured.`:

```markdown
`yarn dev`, `yarn preview`, `yarn db:push` and `yarn db:studio` run through `scripts/with-dev-db.ts`, which fetches the `dev` branch's connection string from the Neon API (`NEON_API_KEY`, `NEON_PROJECT_ID` in `.env`). Local `.env` has no `NUXT_DATABASE_URL`; production (DigitalOcean App Platform) sets its own.
```

In `### Runtime Config`, after the line starting `Set via environment variables prefixed with`, add:

```markdown
Locally, `NUXT_DATABASE_URL` is injected by `scripts/with-dev-db.ts` (Neon `dev` branch) or by `yarn test:e2e:branch` (a throwaway `e2e-*` branch) — never put it in `.env`.
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "Document that local dev always uses the Neon dev branch

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Push to PR #273**

Run: `git push`
Expected: the branch updates on GitHub, and PR #273 shows the new commits.
