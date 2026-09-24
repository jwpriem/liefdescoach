import { describe, it, expect } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setupDotenv } from 'c12'
import { devCommandEnv, parseWrapperArgs } from './dev-db'

describe('devCommandEnv', () => {
    const env = {
        PATH: '/usr/bin',
        NUXT_DATABASE_URL: 'postgresql://prod-from-dotenv',
        NUXT_SESSION_SECRET: 'secret',
        NEON_API_KEY: 'napi_key',
        NEON_PROJECT_ID: 'proj-1',
    }

    it('points the app at the given branch, overriding .env', () => {
        expect(devCommandEnv(env, 'postgresql://dev-branch').NUXT_DATABASE_URL).toBe('postgresql://dev-branch')
    })

    it('keeps the rest of the environment the app needs', () => {
        expect(devCommandEnv(env, 'postgresql://dev-branch')).toMatchObject({ PATH: '/usr/bin', NUXT_SESSION_SECRET: 'secret' })
    })

    it('blanks the Neon API credentials for the app', () => {
        const result = devCommandEnv(env, 'postgresql://dev-branch')
        expect(result.NEON_API_KEY).toBe('')
        expect(result.NEON_PROJECT_ID).toBe('')
    })

    it('survives Nuxt reloading .env: the dev URL wins and the Neon key does not come back', async () => {
        // nuxt dev / nuxt preview load .env through c12, which fills in every key that is undefined
        const dir = mkdtempSync(join(tmpdir(), 'dev-db-'))
        writeFileSync(join(dir, '.env'), 'NUXT_DATABASE_URL=postgresql://prod-from-dotenv\nNEON_API_KEY=napi_key\nNEON_PROJECT_ID=proj-1\n')
        const childEnv = devCommandEnv(env, 'postgresql://dev-branch')

        await setupDotenv({ cwd: dir, env: childEnv })

        expect(childEnv.NUXT_DATABASE_URL).toBe('postgresql://dev-branch')
        expect(childEnv.NEON_API_KEY).toBe('')
        expect(childEnv.NEON_PROJECT_ID).toBe('')
    })

    it('does not modify the environment it was given', () => {
        devCommandEnv(env, 'postgresql://dev-branch')
        expect(env.NUXT_DATABASE_URL).toBe('postgresql://prod-from-dotenv')
        expect(env.NEON_API_KEY).toBe('napi_key')
    })
})

describe('parseWrapperArgs', () => {
    it('passes the command and its arguments through', () => {
        expect(parseWrapperArgs(['nuxt', 'dev', '--port', '4000'])).toEqual({ newDatabase: false, command: 'nuxt', args: ['dev', '--port', '4000'] })
    })

    it('takes --new-database out wherever yarn appended it', () => {
        expect(parseWrapperArgs(['nuxt', 'dev', '--new-database'])).toEqual({ newDatabase: true, command: 'nuxt', args: ['dev'] })
        expect(parseWrapperArgs(['nuxt', 'dev', '--port', '4000', '--new-database'])).toEqual({ newDatabase: true, command: 'nuxt', args: ['dev', '--port', '4000'] })
        expect(parseWrapperArgs(['drizzle-kit', 'studio', '--new-database'])).toEqual({ newDatabase: true, command: 'drizzle-kit', args: ['studio'] })
    })

    it('rejects a missing command', () => {
        expect(() => parseWrapperArgs([])).toThrow(/Usage/)
        expect(() => parseWrapperArgs(['--new-database'])).toThrow(/Usage/)
    })
})
