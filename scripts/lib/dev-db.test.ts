import { describe, it, expect } from 'vitest'
import { devCommandEnv } from './dev-db'

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

    it('does not pass the Neon API credentials to the app', () => {
        const result = devCommandEnv(env, 'postgresql://dev-branch')
        expect(result).not.toHaveProperty('NEON_API_KEY')
        expect(result).not.toHaveProperty('NEON_PROJECT_ID')
    })

    it('does not modify the environment it was given', () => {
        devCommandEnv(env, 'postgresql://dev-branch')
        expect(env.NUXT_DATABASE_URL).toBe('postgresql://prod-from-dotenv')
        expect(env.NEON_API_KEY).toBe('napi_key')
    })
})
