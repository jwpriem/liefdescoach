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
import { neon } from '@neondatabase/serverless'
import { neonClientFromEnv, assertNotProductionUrl, waitForDatabase, type NeonBranch } from './lib/neon'
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
let interrupted = false

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
    process.on(signal, () => {
        interrupted = true
        cleanup().finally(() => process.exit(130))
    })
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
    const sql = neon(created.connectionUri)
    await waitForDatabase(() => sql`select 1`)
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
        // After Ctrl-C the cleanup itself stops the dev server; don't report that as a failure
        if (!interrupted) console.error(err instanceof Error ? err.message : err)
        await cleanup()
        process.exit(interrupted ? 130 : 1)
    })
