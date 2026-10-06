import { beforeEach, describe, expect, it, vi } from 'vitest'

const testState = vi.hoisted(() => ({
  headers: new Map<string, string>(),
  requestOrigin: 'https://www.ravennah.com',
}))

vi.mock('h3', () => ({
  createError: (opts: any) => {
    const err = new Error(opts.statusMessage) as any
    err.statusCode = opts.statusCode
    err.statusMessage = opts.statusMessage
    return err
  },
  getCookie: vi.fn(),
  getHeader: vi.fn((_: any, name: string) => testState.headers.get(name.toLowerCase())),
  getRequestURL: vi.fn(() => ({ origin: testState.requestOrigin })),
  setCookie: vi.fn(),
  deleteCookie: vi.fn(),
}))

import { getPasskeyRequestInfo } from './passkeys'

const event = {} as any

beforeEach(() => {
  testState.headers.clear()
  vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({ appOrigin: 'capacitor://localhost', public: {} }))
})

describe('getPasskeyRequestInfo', () => {
  it('refuses requests from the app', () => {
    testState.headers.set('origin', 'capacitor://localhost')

    expect(() => getPasskeyRequestInfo(event)).toThrow('Passkeys zijn niet beschikbaar in de app')
    try {
      getPasskeyRequestInfo(event)
    } catch (error: any) {
      expect(error.statusCode).toBe(400)
    }
  })

  it('returns the origin and relying party for the website', () => {
    testState.headers.set('origin', 'https://www.ravennah.com')

    expect(getPasskeyRequestInfo(event)).toEqual({
      origin: 'https://www.ravennah.com',
      rpID: 'www.ravennah.com',
      rpName: 'Yoga Ravennah',
    })
  })
})
