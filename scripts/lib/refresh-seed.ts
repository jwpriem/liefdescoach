import { neon } from '@neondatabase/serverless'
import { assertNotProductionUrl, waitForDatabase, type NeonBranch, type NeonClient } from './neon'
import { anonymiseStatements, assertAnonymised } from './anonymise'

/**
 * Rebuilds the anonymised `seed` branch from production, plus a fresh `dev` branch on top.
 * Deletes existing e2e-*, dev and seed branches first (dev data is lost).
 * Used by `yarn db:refresh-seed --yes` and `yarn dev --new-database`.
 */
export async function refreshSeed(neonClient: NeonClient): Promise<void> {
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

    // From the moment Neon starts copying production until anonymisation is verified, `seed` holds
    // real personal data. Any failure or Ctrl-C in that window must delete it — looked up by name,
    // because createBranch can fail after Neon already created the branch.
    const discardSeed = async () => {
        console.error('Seed is not safe to use; deleting it')
        await neonClient.deleteBranchNamed('seed')
    }
    // `on`, not `once`: a second Ctrl-C must not kill us while the raw seed is still being deleted
    const guard = createAbortGuard(discardSeed)
    process.on('SIGINT', guard.onSignal)
    process.on('SIGTERM', guard.onSignal)

    let seed: NeonBranch
    try {
        console.log('Creating seed from production')
        const created = await neonClient.createBranch('seed', production.id)
        seed = created.branch
        assertNotProductionUrl(created.connectionUri, await neonClient.productionHosts())

        const sql = neon(created.connectionUri)
        await waitForDatabase(() => sql`select 1`)
        console.log('Anonymising seed')
        await sql.transaction(anonymiseStatements().map((statement) => sql.query(statement)))
        await assertAnonymised((statement) => sql.query(statement) as Promise<{ n: number | string }[]>)
    } catch (err) {
        await guard.settle() // an interrupt already discards the seed and exits
        await discardSeed()
        throw err
    } finally {
        process.off('SIGINT', guard.onSignal)
        process.off('SIGTERM', guard.onSignal)
    }
    // A Ctrl-C that landed just before this point must win: never create dev or start a server after it
    await guard.settle()

    console.log('Creating dev from seed')
    await neonClient.createBranch('dev', seed.id)
}

/**
 * Interrupt handling for the window in which `seed` may hold raw production data:
 * the first signal starts the discard (later ones are ignored) and exits 130 only after it finished;
 * `settle()` lets the refresh wait for such an abort instead of carrying on.
 */
export function createAbortGuard(discard: () => Promise<void>, exit: (code: number) => void = (code) => process.exit(code)) {
    let aborting: Promise<void> | undefined
    return {
        onSignal: () => { aborting ??= discard().finally(() => exit(130)) },
        settle: async () => { if (aborting) await aborting },
        get aborted() { return aborting !== undefined },
    }
}
