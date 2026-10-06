import { beforeEach, describe, expect, it, vi } from 'vitest'

const testState = vi.hoisted(() => ({ headers: new Map<string, string>() }))

vi.mock('h3', () => ({
  createError: (opts: any) => Object.assign(new Error(opts.statusMessage), opts),
  getHeader: vi.fn((_: any, name: string) => testState.headers.get(name.toLowerCase())),
}))

import { getBearerToken, isNativeAppRequest } from './native-app'

const event = {} as any

beforeEach(() => {
  testState.headers.clear()
  vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({ appOrigin: 'capacitor://localhost', public: {} }))
})

describe('isNativeAppRequest', () => {
  it('is true when the Origin is the app origin', () => {
    testState.headers.set('origin', 'capacitor://localhost')
    expect(isNativeAppRequest(event)).toBe(true)
  })

  it('is false for the website and for other origins', () => {
    testState.headers.set('origin', 'https://www.ravennah.com')
    expect(isNativeAppRequest(event)).toBe(false)
    testState.headers.set('origin', 'https://attacker.test')
    expect(isNativeAppRequest(event)).toBe(false)
  })

  it('is false without an Origin header', () => {
    expect(isNativeAppRequest(event)).toBe(false)
  })

  it('is false when no app origin is configured, even for an empty Origin', () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({ appOrigin: '', public: {} }))
    testState.headers.set('origin', '')
    expect(isNativeAppRequest(event)).toBe(false)
  })
})

describe('getBearerToken', () => {
  it('returns the token from a Bearer header', () => {
    testState.headers.set('authorization', 'Bearer abc123')
    expect(getBearerToken(event)).toBe('abc123')
  })

  it('returns null for a missing header or another scheme', () => {
    expect(getBearerToken(event)).toBeNull()
    testState.headers.set('authorization', 'Basic abc123')
    expect(getBearerToken(event)).toBeNull()
  })
})
