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

/**
 * The first request to a just-created branch can fail with "fetch failed" even after
 * Neon reports the create operation finished. Retry a trivial query until it answers.
 */
export async function waitForDatabase(
    query: () => Promise<unknown>,
    { attempts = 15, delayMs = 2000 }: { attempts?: number; delayMs?: number } = {}
): Promise<void> {
    let lastError: unknown
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            await query()
            return
        } catch (err) {
            lastError = err
            if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
    }
    const reason = lastError instanceof Error ? lastError.message : String(lastError)
    throw new Error(`Database not reachable after ${attempts} attempts: ${reason}`)
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
