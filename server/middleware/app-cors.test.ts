import { beforeEach, describe, expect, it, vi } from 'vitest'

const testState = vi.hoisted(() => ({
  headers: new Map<string, string>(),
  method: 'GET',
  pathname: '/api/lessons',
  responseHeaders: {} as Record<string, string>,
  sendNoContent: vi.fn(() => 'no-content'),
}))

vi.mock('h3', () => ({
  createError: (opts: any) => Object.assign(new Error(opts.statusMessage), opts),
  getHeader: vi.fn((_: any, name: string) => testState.headers.get(name.toLowerCase())),
  getMethod: vi.fn(() => testState.method),
  getRequestURL: vi.fn(() => new URL(`https://www.ravennah.com${testState.pathname}`)),
  setResponseHeaders: vi.fn((_: any, headers: Record<string, string>) => { Object.assign(testState.responseHeaders, headers) }),
  sendNoContent: testState.sendNoContent,
}))

import handler from './app-cors'

const event = {} as any
const handle = handler as unknown as (event: any) => unknown

beforeEach(() => {
  testState.headers.clear()
  testState.method = 'GET'
  testState.pathname = '/api/lessons'
  testState.responseHeaders = {}
  testState.sendNoContent.mockClear()
  vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({ appOrigin: 'capacitor://localhost', public: {} }))
})

describe('app CORS middleware', () => {
  it('grants the app origin and exposes the session token header', () => {
    testState.headers.set('origin', 'capacitor://localhost')

    expect(handle(event)).toBeUndefined()
    expect(testState.responseHeaders).toMatchObject({
      'Access-Control-Allow-Origin': 'capacitor://localhost',
      'Access-Control-Allow-Headers': 'authorization, content-type',
      'Access-Control-Expose-Headers': 'x-session-token',
      Vary: 'Origin',
    })
  })

  it('answers the app preflight with 204', () => {
    testState.headers.set('origin', 'capacitor://localhost')
    testState.method = 'OPTIONS'

    expect(handle(event)).toBe('no-content')
    expect(testState.sendNoContent).toHaveBeenCalledWith(event, 204)
    expect(testState.responseHeaders['Access-Control-Allow-Methods']).toBe('GET, POST, OPTIONS')
  })

  it('grants nothing to a preflight from an unknown origin', () => {
    testState.headers.set('origin', 'https://attacker.test')
    testState.method = 'OPTIONS'

    expect(handle(event)).toBeUndefined()
    expect(testState.responseHeaders).toEqual({})
    expect(testState.sendNoContent).not.toHaveBeenCalled()
  })

  it('leaves website requests alone', () => {
    testState.headers.set('origin', 'https://www.ravennah.com')

    handle(event)

    expect(testState.responseHeaders).toEqual({})
  })

  it('only applies to API routes', () => {
    testState.headers.set('origin', 'capacitor://localhost')
    testState.pathname = '/account'

    handle(event)

    expect(testState.responseHeaders).toEqual({})
  })
})
