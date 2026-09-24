/**
 * Prints the connection string of a test branch (seed, dev or e2e-*) to stdout.
 * Pipe it instead of displaying it: yarn -s db:branch-url dev | pbcopy
 *
 * Required env vars: NEON_API_KEY, NEON_PROJECT_ID
 */

import 'dotenv/config'
import { neonClientFromEnv } from './lib/neon'

async function main() {
    const name = process.argv[2]
    if (!name) throw new Error('Usage: yarn -s db:branch-url <seed|dev|e2e-...>')

    process.stdout.write(await neonClientFromEnv().safeConnectionUri(name))
}

main().catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
})
