import { vi } from 'vitest'

/**
 * Chainable Drizzle stand-in for route tests.
 * Every awaited select chain (via `.limit()` or a bare `await`) resolves to the
 * next entry in `results`, in call order. Missing entries resolve to [].
 */
export function createQueuedDb(results: any[][] = []) {
    let index = 0
    const next = () => Promise.resolve(results[index++] ?? [])

    const selectChain: any = {}
    for (const method of ['from', 'where', 'innerJoin', 'leftJoin', 'orderBy', 'groupBy']) {
        selectChain[method] = vi.fn(() => selectChain)
    }
    selectChain.limit = vi.fn(() => next())
    selectChain.then = (ok: any, fail: any) => next().then(ok, fail)

    const writeChain = () => {
        const chain: any = {}
        for (const method of ['values', 'set', 'where', 'onConflictDoNothing', 'onConflictDoUpdate']) {
            chain[method] = vi.fn(() => chain)
        }
        chain.returning = vi.fn(() => Promise.resolve([{ id: 'mock-id' }]))
        chain.then = (ok: any, fail: any) => Promise.resolve([]).then(ok, fail)
        return chain
    }

    const inserter = writeChain()
    const updater = writeChain()
    const deleter = writeChain()

    return {
        select: vi.fn(() => selectChain),
        insert: vi.fn(() => inserter),
        update: vi.fn(() => updater),
        delete: vi.fn(() => deleter),
        selectChain,
        inserter,
        updater,
        deleter,
    }
}

/** Makes `requireAuth` (and everything built on it) see the given user. */
export function asUser(
    id: string,
    opts: { admin?: boolean; email?: string | null; name?: string } = {}
) {
    vi.stubGlobal('getSessionUser', vi.fn().mockResolvedValue({
        userId: id,
        email: opts.email === undefined ? `${id}@test.nl` : opts.email,
        name: opts.name ?? id,
        isAdmin: opts.admin ?? false,
    }))
}
