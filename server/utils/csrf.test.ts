import { beforeEach, describe, expect, it, vi } from 'vitest'

const testState = vi.hoisted(() => ({
  headers: new Map<string, string>(),
  cookies: new Map<string, string>(),
  method: 'POST',
  setCookie: vi.fn(),
}))

vi.mock('h3', () => ({
  createError: (opts: any) => {
    const err = new Error(opts.statusMessage) as any
    err.statusCode = opts.statusCode
    err.statusMessage = opts.statusMessage
    return err
  },
  getCookie: vi.fn((_: any, name: string) => testState.cookies.get(name)),
  getHeader: vi.fn((_: any, name: string) => testState.headers.get(name.toLowerCase())),
  getMethod: vi.fn(() => testState.method),
  setCookie: vi.fn((event: any, name: string, value: string, options: any) => {
    testState.cookies.set(name, value)
    testState.setCookie(event, name, value, options)
  }),
}))

import {
  assertSameOrigin,
  assertValidCsrfToken,
  createCsrfToken,
  isCsrfSafeMethod,
  requireCsrfProtection,
} from './csrf'

const event = {} as any

beforeEach(() => {
  testState.headers.clear()
  testState.cookies.clear()
  testState.method = 'POST'
  testState.setCookie.mockClear()
  testState.headers.set('host', 'ravennah.test')
  testState.headers.set('x-forwarded-proto', 'https')
  testState.headers.set('origin', 'https://ravennah.test')
})

describe('CSRF helper', () => {
  it('creates a csrf cookie and returns the token', () => {
    const token = createCsrfToken(event)

    expect(token).toHaveLength(43)
    expect(testState.cookies.get('rav_csrf')).toBe(token)
    expect(testState.setCookie).toHaveBeenCalledWith(event, 'rav_csrf', token, expect.objectContaining({
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
    }))
  })

  it('treats GET, HEAD and OPTIONS as safe methods', () => {
    expect(isCsrfSafeMethod('GET')).toBe(true)
    expect(isCsrfSafeMethod('HEAD')).toBe(true)
    expect(isCsrfSafeMethod('OPTIONS')).toBe(true)
    expect(isCsrfSafeMethod('POST')).toBe(false)
  })

  it('allows same-origin requests using the Origin header', () => {
    expect(() => assertSameOrigin(event)).not.toThrow()
  })

  it('allows same-origin requests using the Referer header when Origin is absent', () => {
    testState.headers.delete('origin')
    testState.headers.set('referer', 'https://ravennah.test/account')

    expect(() => assertSameOrigin(event)).not.toThrow()
  })

  it('rejects cross-origin requests', () => {
    testState.headers.set('origin', 'https://attacker.test')

    expect(() => assertSameOrigin(event)).toThrow(expect.objectContaining({ statusCode: 403 }))
  })

  it('rejects missing tokens', () => {
    expect(() => assertValidCsrfToken(event)).toThrow(expect.objectContaining({
      statusCode: 403,
      statusMessage: 'CSRF-token ontbreekt',
    }))
  })

  it('rejects invalid tokens', () => {
    testState.cookies.set('rav_csrf', 'valid-token')
    testState.headers.set('x-csrf-token', 'invalid-token')

    expect(() => assertValidCsrfToken(event)).toThrow(expect.objectContaining({
      statusCode: 403,
      statusMessage: 'Ongeldig CSRF-token',
    }))
  })

  it('accepts matching cookie and header tokens', () => {
    testState.cookies.set('rav_csrf', 'valid-token')
    testState.headers.set('x-csrf-token', 'valid-token')

    expect(() => assertValidCsrfToken(event)).not.toThrow()
  })

  it('requires origin and token checks for mutating requests', () => {
    testState.cookies.set('rav_csrf', 'valid-token')
    testState.headers.set('x-csrf-token', 'valid-token')

    expect(() => requireCsrfProtection(event)).not.toThrow()
  })

  it('skips token checks for safe methods', () => {
    testState.method = 'GET'
    testState.headers.set('origin', 'https://attacker.test')

    expect(() => requireCsrfProtection(event)).not.toThrow()
  })
})
