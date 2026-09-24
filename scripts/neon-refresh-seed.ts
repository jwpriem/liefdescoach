/**
 * Rebuilds the anonymised `seed` branch from production, plus a fresh `dev` branch on top.
 * Deletes existing e2e-*, dev and seed branches first (dev data is lost).
 *
 * Usage: yarn db:refresh-seed --yes
 * Required env vars: NEON_API_KEY, NEON_PROJECT_ID
 */

import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { neonClientFromEnv, assertNotProductionUrl, waitForDatabase, type NeonBranch } from './lib/neon'
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
        await waitForDatabase(() => sql`select 1`)
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
