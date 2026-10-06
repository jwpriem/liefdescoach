import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueuedDb } from '../test-utils'

const testState = vi.hoisted(() => ({
  headers: new Map<string, string>(),
  cookies: new Map<string, string>(),
  responseHeaders: new Map<string, string>(),
  setCookie: vi.fn(),
  deleteCookie: vi.fn(),
}))

vi.mock('h3', () => ({
  createError: (opts: any) => Object.assign(new Error(opts.statusMessage), opts),
  getCookie: vi.fn((_: any, name: string) => testState.cookies.get(name)),
  getHeader: vi.fn((_: any, name: string) => testState.headers.get(name.toLowerCase())),
  setCookie: testState.setCookie,
  deleteCookie: testState.deleteCookie,
  setResponseHeader: vi.fn((_: any, name: string, value: string) => { testState.responseHeaders.set(name, value) }),
}))

import { createSession, destroySession, getSessionUser } from './auth-session'

const event = {} as any
const DAY = 24 * 60 * 60 * 1000
const sessionRow = (expiresInDays: number) => ({
  sessionId: 'session_1',
  userId: 'user_1',
  expiresAt: new Date(Date.now() + expiresInDays * DAY),
  name: 'Test',
  email: 'test@example.test',
  isAdmin: false,
})

const fromApp = () => testState.headers.set('origin', 'capacitor://localhost')
const useDb = (results: any[][] = []) => {
  const db = createQueuedDb(results)
  vi.stubGlobal('db', db)
  return db
}

beforeEach(() => {
  testState.headers.clear()
  testState.cookies.clear()
  testState.responseHeaders.clear()
  testState.setCookie.mockClear()
  testState.deleteCookie.mockClear()
  vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({ appOrigin: 'capacitor://localhost', public: {} }))
})

describe('createSession', () => {
  it('sets the session cookie for the website and no token header', async () => {
    useDb()
    const token = await createSession(event, 'user_1')

    expect(testState.setCookie).toHaveBeenCalledWith(event, 'rav_session', token, expect.objectContaining({ httpOnly: true, sameSite: 'lax' }))
    expect(testState.responseHeaders.has('x-session-token')).toBe(false)
  })

  it('hands the token to the app in a response header and sets no cookie', async () => {
    useDb()
    fromApp()
    const token = await createSession(event, 'user_1')

    expect(testState.responseHeaders.get('x-session-token')).toBe(token)
    expect(testState.setCookie).not.toHaveBeenCalled()
  })
})

describe('getSessionUser', () => {
  it('reads the cookie for the website', async () => {
    useDb([[sessionRow(10)]])
    testState.cookies.set('rav_session', 'web-token')

    await expect(getSessionUser(event)).resolves.toMatchObject({ userId: 'user_1' })
  })

  it('reads the bearer token for the app', async () => {
    useDb([[sessionRow(29.9)]])
    fromApp()
    testState.headers.set('authorization', 'Bearer app-token')

    await expect(getSessionUser(event)).resolves.toMatchObject({ userId: 'user_1' })
  })

  it('ignores a bearer token that does not come from the app origin', async () => {
    const db = useDb([[sessionRow(10)]])
    testState.headers.set('origin', 'https://attacker.test')
    testState.headers.set('authorization', 'Bearer leaked-token')

    await expect(getSessionUser(event)).resolves.toBeNull()
    expect(db.select).not.toHaveBeenCalled()
  })

  it('ignores a website cookie on an app request without a token', async () => {
    const db = useDb([[sessionRow(10)]])
    fromApp()
    testState.cookies.set('rav_session', 'web-token')

    await expect(getSessionUser(event)).resolves.toBeNull()
    expect(db.select).not.toHaveBeenCalled()
  })

  it('returns null when the token matches no live session', async () => {
    useDb([[]])
    fromApp()
    testState.headers.set('authorization', 'Bearer expired-token')

    await expect(getSessionUser(event)).resolves.toBeNull()
  })

  it('pushes an app session forward once it is more than a day old', async () => {
    const db = useDb([[sessionRow(20)]])
    fromApp()
    testState.headers.set('authorization', 'Bearer app-token')

    await getSessionUser(event)

    expect(db.updater.set).toHaveBeenCalledWith({ expiresAt: expect.any(Date) })
    const renewedTo = db.updater.set.mock.calls[0][0].expiresAt.getTime()
    expect(renewedTo).toBeGreaterThan(Date.now() + 29 * DAY)
  })

  it('does not write on every request of a fresh app session', async () => {
    const db = useDb([[sessionRow(29.9)]])
    fromApp()
    testState.headers.set('authorization', 'Bearer app-token')

    await getSessionUser(event)

    expect(db.update).not.toHaveBeenCalled()
  })

  it('never renews a website session', async () => {
    const db = useDb([[sessionRow(2)]])
    testState.cookies.set('rav_session', 'web-token')

    await getSessionUser(event)

    expect(db.update).not.toHaveBeenCalled()
  })
})

describe('destroySession', () => {
  it('deletes the session and clears the cookie for the website', async () => {
    const db = useDb()
    testState.cookies.set('rav_session', 'web-token')

    await destroySession(event)

    expect(db.delete).toHaveBeenCalled()
    expect(testState.deleteCookie).toHaveBeenCalledWith(event, 'rav_session', { path: '/' })
  })

  it('deletes the session by bearer token for the app and touches no cookie', async () => {
    const db = useDb()
    fromApp()
    testState.headers.set('authorization', 'Bearer app-token')

    await destroySession(event)

    expect(db.delete).toHaveBeenCalled()
    expect(testState.deleteCookie).not.toHaveBeenCalled()
  })
})
