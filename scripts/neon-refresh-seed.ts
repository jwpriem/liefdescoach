/**
 * Rebuilds the anonymised `seed` branch from production, plus a fresh `dev` branch on top.
 * Deletes existing e2e-*, dev and seed branches first (dev data is lost).
 *
 * Usage: yarn db:refresh-seed --yes   (or: yarn dev --new-database, which also starts the dev server)
 * Required env vars: NEON_API_KEY, NEON_PROJECT_ID
 */

import 'dotenv/config'
import { neonClientFromEnv } from './lib/neon'
import { refreshSeed } from './lib/refresh-seed'

async function main() {
    if (!process.argv.includes('--yes')) {
        console.error('This deletes the current seed, dev and e2e-* branches. Re-run with --yes to continue.')
        process.exit(1)
    }

    await refreshSeed(neonClientFromEnv())
    console.log('Done. yarn dev now uses the fresh dev branch.')
}

main().catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
})
