import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const API_DIR = fileURLToPath(new URL('.', import.meta.url))
const GUARD = /\b(requireAuth|requireAdmin|requireSelfOrAdmin|getSessionUser)\(|cronSecret/

/** Routes that are intentionally reachable without a session. Adding one here is a security decision. */
const PUBLIC_ROUTES = [
    'auth/login.post.ts',
    'auth/logout.post.ts',
    'auth/passkeys/login/options.post.ts',
    'auth/passkeys/login/verify.post.ts',
    'auth/register.post.ts',
    'auth/request-password-reset.post.ts',
    'auth/reset-password.post.ts',
    'auth/send-otp.post.ts',
    'auth/verify-email.post.ts',
    'auth/verify-otp.post.ts',
    'csrf-token.get.ts', // issues the CSRF token; must work before login
    'lessons.get.ts',
    'mail/send.post.ts',
    'passwordRecovery.post.ts', // empty legacy file
    'ping.get.ts',
]

function routeFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) return routeFiles(full)
        return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [full] : []
    })
}

describe('API route guards', () => {
    it.each(routeFiles(API_DIR).map((f) => relative(API_DIR, f)))('%s is guarded or explicitly public', (route) => {
        if (PUBLIC_ROUTES.includes(route)) return
        expect(readFileSync(join(API_DIR, route), 'utf8')).toMatch(GUARD)
    })

    it.each(PUBLIC_ROUTES)('public allowlist entry %s still exists', (route) => {
        expect(existsSync(join(API_DIR, route))).toBe(true)
    })
})
