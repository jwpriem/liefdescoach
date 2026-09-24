/**
 * Runs a command against the Neon `dev` branch instead of any database URL in .env.
 *
 * Usage (via package.json): yarn dev, yarn preview, yarn db:push, yarn db:studio
 *   add --new-database to first rebuild seed + dev from a fresh anonymised copy of production
 *   tsx scripts/with-dev-db.ts <command> [args...]
 *
 * Never falls back to .env: if Neon can't be reached, nothing starts.
 * Required env vars: NEON_API_KEY, NEON_PROJECT_ID
 */

import 'dotenv/config'
import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { neonClientFromEnv } from './lib/neon'
import { DEV_BRANCH, devCommandEnv, parseWrapperArgs } from './lib/dev-db'
import { refreshSeed } from './lib/refresh-seed'

async function main() {
    const { newDatabase, command, args } = parseWrapperArgs(process.argv.slice(2))
    const neonClient = neonClientFromEnv()

    if (newDatabase) {
        console.log('--new-database: rebuilding seed and dev from a fresh anonymised copy of production')
        await refreshSeed(neonClient)
    }

    const databaseUrl = await neonClient.safeConnectionUri(DEV_BRANCH)
    console.log(`Using Neon branch "${DEV_BRANCH}"`)

    // Run the local binary directly: `yarn` in between doesn't forward signals, which orphaned the server.
    // Not detached: interactive tools (drizzle-kit push prompts) need the terminal.
    const bin = join('node_modules', '.bin', command)
    const child = spawn(bin, args, { stdio: 'inherit', env: devCommandEnv(process.env, databaseUrl) })

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
