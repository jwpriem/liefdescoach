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
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { neon } from '@neondatabase/serverless'
import { neonClientFromEnv, assertNotProductionUrl, waitForDatabase } from './lib/neon'

const statements = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../drizzle/0006_ios_push.sql'), 'utf-8')
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean)

const COLUMNS = `
    select table_name, column_name, data_type, is_nullable, column_default
    from information_schema.columns
    where table_schema = 'public'
      and ((table_name = 'push_subscriptions' and column_name in ('platform', 'p256dh', 'auth'))
       or (table_name = 'sessions' and column_name = 'kind'))
    order by table_name, column_name`

type Sql = ReturnType<typeof neon>
type MigrationPath = 'applied' | 'already-applied'

// One transaction: either all four statements land or none. The lock timeout makes the ALTER on
// `sessions` fail fast instead of queueing every live request behind it.
async function runInTransaction(sql: Sql, extra: string[] = []): Promise<void> {
    await sql.transaction((txn) => [
        txn.query(`SET LOCAL lock_timeout = '5s'`),
        ...[...statements, ...extra].map((statement) => txn.query(statement)),
    ])
}

async function migrate(url: string): Promise<MigrationPath> {
    const sql = neon(url)
    console.log('\nColumns before:')
    const before = await sql.query(COLUMNS) as { column_name: string }[]
    console.table(before)

    const added = before.filter((c) => c.column_name === 'platform' || c.column_name === 'kind').length
    if (added === 2) {
        console.log('Already applied — nothing to do.')
        return 'already-applied'
    }
    // The migration is atomic, so this can only be left by an earlier, non-atomic version of this script
    if (added === 1) throw new Error('Half applied: one of platform/kind exists. Inspect the database by hand.')

    for (const statement of statements) console.log(`Running: ${statement}`)
    await runInTransaction(sql)

    console.log('\nColumns after:')
    console.table(await sql.query(COLUMNS))
    return 'applied'
}

// Throwaway branch only: both tables are empty in `seed`, so the old NOT NULLs can be restored
async function revertToPre0006(sql: Sql): Promise<void> {
    await sql.transaction((txn) => [
        txn.query(`ALTER TABLE "push_subscriptions" DROP COLUMN IF EXISTS "platform"`),
        txn.query(`ALTER TABLE "sessions" DROP COLUMN IF EXISTS "kind"`),
        txn.query(`DELETE FROM "push_subscriptions" WHERE "p256dh" IS NULL OR "auth" IS NULL`),
        txn.query(`ALTER TABLE "push_subscriptions" ALTER COLUMN "p256dh" SET NOT NULL`),
        txn.query(`ALTER TABLE "push_subscriptions" ALTER COLUMN "auth" SET NOT NULL`),
    ])
}

async function dryRun(): Promise<void> {
    const client = neonClientFromEnv()
    const seed = (await client.listBranches()).find((b) => b.name === 'seed')
    if (!seed) throw new Error('No seed branch. Create it first: yarn db:refresh-seed --yes')

    // The e2e- prefix is required: the Neon helper only creates and deletes seed, dev and e2e-* branches
    const created = await client.createBranch(`e2e-migration-0006-dryrun-${Date.now()}`, seed.id)
    console.log(`Dry run on throwaway branch ${created.branch.name}`)
    try {
        assertNotProductionUrl(created.connectionUri, await client.productionHosts())
        const sql = neon(created.connectionUri)
        await waitForDatabase(() => sql`select 1`)

        // `seed` already has 0006, so a fresh branch would skip the real path: go back to the old shape first
        if ((await sql.query(COLUMNS) as unknown[]).length > 0) {
            await revertToPre0006(sql)
            console.log('Branch had 0006 already; put it back into the pre-0006 shape (dropped platform and kind, p256dh and auth NOT NULL).')
        }

        // The seed wipes both tables, so add one old-shape row each to prove existing rows survive
        const [student] = await sql.query('select id from students limit 1') as { id: string }[]
        await sql.query(`insert into sessions (id, user_id, token_hash, expires_at) values ('dryrun-session', $1, 'dryrun-hash', now() + interval '1 day')`, [student.id])
        await sql.query(`insert into push_subscriptions (id, student_id, endpoint, p256dh, auth) values ('dryrun-web', $1, 'https://dryrun.example/endpoint', 'key', 'auth')`, [student.id])

        if (await migrate(created.connectionUri) !== 'applied') {
            throw new Error('Dry run did not exercise the migration (it reported "Already applied").')
        }

        // A new-shape row: an iOS token without web-push keys
        await sql.query(`insert into push_subscriptions (id, student_id, platform, endpoint) values ('dryrun-ios', $1, 'ios', 'abcdef0123456789')`, [student.id])

        console.log('\nExisting session after the migration:')
        console.table(await sql.query(`select id, kind from sessions where id = 'dryrun-session'`))
        console.log('Push subscriptions after the migration (old web row, new iOS row):')
        console.table(await sql.query(`select id, platform, endpoint, p256dh, auth from push_subscriptions where id like 'dryrun-%' order by id`))

        // Atomicity: the same four statements plus one that must fail. Nothing may be left behind.
        console.log('\nAtomicity check: back to the pre-0006 shape, then the migration plus one failing statement.')
        await revertToPre0006(sql)
        const columnsBefore = await sql.query(COLUMNS)
        console.log('Columns before:')
        console.table(columnsBefore)
        try {
            await runInTransaction(sql, [`ALTER TABLE "sessions" ADD COLUMN "kind" text`])
            throw new Error('The deliberately failing statement did not fail.')
        } catch (err) {
            if (err instanceof Error && err.message.startsWith('The deliberately')) throw err
            console.log(`Transaction failed as intended: ${err instanceof Error ? err.message : err}`)
        }
        const columnsAfter = await sql.query(COLUMNS)
        console.log('Columns after a failed run:')
        console.table(columnsAfter)
        if (JSON.stringify(columnsBefore) !== JSON.stringify(columnsAfter)) {
            throw new Error('Not atomic: the failed run changed the schema.')
        }
        console.log('Atomic: "Columns after a failed run" equals "Columns before".')
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
