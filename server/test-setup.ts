/**
 * Vitest setup file — stubs Nitro/H3 auto-imports that are called at module
 * load time (e.g. defineEventHandler). Must run before any test file imports.
 */
import { vi } from 'vitest'

// defineEventHandler just returns its handler so tests can call it directly
vi.stubGlobal('defineEventHandler', (handler: any) => handler)

// H3 utilities that are auto-imported by Nitro
vi.stubGlobal('readBody', vi.fn())
vi.stubGlobal('createError', (opts: { statusCode: number; statusMessage: string }) => {
  const err = new Error(opts.statusMessage) as any
  err.statusCode = opts.statusCode
  err.statusMessage = opts.statusMessage
  return err
})
vi.stubGlobal('getHeader', vi.fn())
vi.stubGlobal('getRequestIP', vi.fn().mockReturnValue('127.0.0.1'))
vi.stubGlobal('setCookie', vi.fn())
vi.stubGlobal('getCookie', vi.fn())
vi.stubGlobal('deleteCookie', vi.fn())
vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({ sessionSecret: 'test-secret', public: {} }))

vi.mock('h3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('h3')>()
  return {
    ...actual,
    getRequestIP: vi.fn().mockReturnValue('127.0.0.1'),
    readBody: vi.fn(),
    createError: actual.createError,
  }
})

// Server utils auto-imports
vi.stubGlobal('db', {})
vi.stubGlobal('createSession', vi.fn())
vi.stubGlobal('getSessionUser', vi.fn())
vi.stubGlobal('destroySession', vi.fn())
vi.stubGlobal('requireAuth', vi.fn())
vi.stubGlobal('requireAdmin', vi.fn())
vi.stubGlobal('generateSignedToken', vi.fn().mockReturnValue('mock-token'))
vi.stubGlobal('verifySignedToken', vi.fn().mockReturnValue({}))
vi.stubGlobal('generateId', vi.fn().mockReturnValue('mock-id'))
vi.stubGlobal('smtpTransport', { sendMail: vi.fn().mockResolvedValue({}) })
vi.stubGlobal('passwordResetEmail', vi.fn().mockReturnValue({ subject: '', html: '', text: '' }))
vi.stubGlobal('passwordResetMigrationEmail', vi.fn().mockReturnValue({ subject: '', html: '', text: '' }))
vi.stubGlobal('otpEmail', vi.fn().mockReturnValue({ subject: '', html: '', text: '' }))
