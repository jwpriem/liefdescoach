import { describe, it, expect, vi } from 'vitest'
import { createNeonClient, assertSafeToModify, assertNotProductionUrl, type NeonBranch } from './neon'

const API = 'https://console.neon.tech/api/v2/projects/proj-1'
const production: NeonBranch = { id: 'br-prod', name: 'production', primary: true, default: true }
const seed: NeonBranch = { id: 'br-seed', name: 'seed', parent_id: 'br-prod' }

/** Fake fetch answering by "METHOD path" → JSON body. Records every call. */
function fakeFetch(routes: Record<string, any>) {
    return vi.fn(async (url: string, init: RequestInit = {}) => {
        const key = `${init.method ?? 'GET'} ${url.replace(API, '')}`
        if (!(key in routes)) return new Response(JSON.stringify({ message: `no route ${key}` }), { status: 404 })
        return new Response(JSON.stringify(routes[key]), { status: 200 })
    })
}

describe('assertSafeToModify', () => {
    it.each([
        ['production by name', { id: 'x', name: 'production' }],
        ['primary branch', { id: 'x', name: 'seed', primary: true }],
        ['default branch', { id: 'x', name: 'dev', default: true }],
        ['protected branch', { id: 'x', name: 'e2e-1', protected: true }],
        ['unknown name', { id: 'x', name: 'staging' }],
    ])('refuses a %s', (_label, branch) => {
        expect(() => assertSafeToModify(branch as NeonBranch)).toThrow(/Refusing/)
    })

    it.each(['seed', 'dev', 'e2e-20260924-101500'])('allows %s', (name) => {
        expect(() => assertSafeToModify({ id: 'x', name })).not.toThrow()
    })
})

describe('assertNotProductionUrl', () => {
    const prodHosts = ['ep-empty-resonance-agcehj7b.c-2.eu-central-1.aws.neon.tech']

    it('refuses the production host', () => {
        expect(() => assertNotProductionUrl('postgresql://u:p@ep-empty-resonance-agcehj7b.c-2.eu-central-1.aws.neon.tech/neondb', prodHosts)).toThrow(/production/)
    })

    it('refuses the pooled production host', () => {
        expect(() => assertNotProductionUrl('postgresql://u:p@ep-empty-resonance-agcehj7b-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require', prodHosts)).toThrow(/production/)
    })

    it('allows another endpoint', () => {
        expect(() => assertNotProductionUrl('postgresql://u:p@ep-other-123.c-2.eu-central-1.aws.neon.tech/neondb', prodHosts)).not.toThrow()
    })

    it('refuses when production hosts are unknown', () => {
        expect(() => assertNotProductionUrl('postgresql://u:p@ep-other-123.neon.tech/neondb', [])).toThrow(/production/)
    })
})

describe('createNeonClient', () => {
    it('sends the API key and lists branches', async () => {
        const fetch = fakeFetch({ 'GET /branches': { branches: [production, seed] } })
        const client = createNeonClient({ apiKey: 'key-1', projectId: 'proj-1', fetch })

        await expect(client.findBranch('seed')).resolves.toEqual(seed)
        expect(fetch.mock.calls[0][1].headers).toMatchObject({ Authorization: 'Bearer key-1' })
    })

    it('creates a branch with a read-write endpoint and waits for its operations', async () => {
        const fetch = fakeFetch({
            'POST /branches': {
                branch: { id: 'br-e2e', name: 'e2e-1', parent_id: 'br-seed' },
                operations: [{ id: 'op-1', status: 'running' }],
                connection_uris: [{ connection_uri: 'postgresql://u:p@ep-e2e.neon.tech/neondb' }],
            },
            'GET /operations/op-1': { operation: { id: 'op-1', status: 'finished' } },
        })
        const client = createNeonClient({ apiKey: 'k', projectId: 'proj-1', fetch, pollMs: 0 })

        const result = await client.createBranch('e2e-1', 'br-seed')

        expect(result.connectionUri).toBe('postgresql://u:p@ep-e2e.neon.tech/neondb')
        const body = JSON.parse(fetch.mock.calls[0][1].body as string)
        expect(body).toEqual({ branch: { name: 'e2e-1', parent_id: 'br-seed' }, endpoints: [{ type: 'read_write' }] })
        expect(fetch).toHaveBeenCalledWith(`${API}/operations/op-1`, expect.anything())
    })

    it('fails when a branch operation fails', async () => {
        const fetch = fakeFetch({
            'POST /branches': { branch: { id: 'br-e2e', name: 'e2e-1' }, operations: [{ id: 'op-1' }], connection_uris: [{ connection_uri: 'x' }] },
            'GET /operations/op-1': { operation: { id: 'op-1', status: 'failed' } },
        })
        const client = createNeonClient({ apiKey: 'k', projectId: 'proj-1', fetch, pollMs: 0 })

        await expect(client.createBranch('e2e-1', 'br-seed')).rejects.toThrow(/op-1.*failed/)
    })

    it('never sends a DELETE for production', async () => {
        const fetch = fakeFetch({})
        const client = createNeonClient({ apiKey: 'k', projectId: 'proj-1', fetch })

        await expect(client.deleteBranch(production)).rejects.toThrow(/Refusing/)
        expect(fetch).not.toHaveBeenCalled()
    })

    it('collects endpoint hosts of the production branch', async () => {
        const fetch = fakeFetch({
            'GET /branches': { branches: [production, seed] },
            'GET /branches/br-prod/endpoints': { endpoints: [{ host: 'ep-prod.neon.tech' }] },
        })
        const client = createNeonClient({ apiKey: 'k', projectId: 'proj-1', fetch })

        await expect(client.productionHosts()).resolves.toEqual(['ep-prod.neon.tech'])
    })

    it('surfaces API errors with the status code', async () => {
        const fetch = fakeFetch({})
        const client = createNeonClient({ apiKey: 'k', projectId: 'proj-1', fetch })

        await expect(client.listBranches()).rejects.toThrow(/404/)
    })
})
