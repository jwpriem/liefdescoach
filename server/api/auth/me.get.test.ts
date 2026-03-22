import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './me.get'

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('getSessionUser', vi.fn())
  vi.stubGlobal('createError', vi.fn((opts: any) => {
    const err = new Error(opts.statusMessage) as any
    err.statusCode = opts.statusCode
    err.statusMessage = opts.statusMessage
    return err
  }))
})

const handle = typeof handler === 'function'
  ? handler
  : (handler as any).handler ?? handler

describe('GET /api/auth/me', () => {
  it('throws 401 when no session exists', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null)

    await expect(handle({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns user data for authenticated user', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'u1',
      email: 'user@test.com',
      name: 'Test User',
      isAdmin: false,
      emailVerified: true,
      archived: false,
      reminders: true,
      pushNotifications: false,
    } as any)

    const result = await handle({} as any)

    expect(result).toEqual({
      $id: 'u1',
      email: 'user@test.com',
      name: 'Test User',
      labels: [],
      emailVerification: true,
      archived: false,
      reminders: true,
      pushNotifications: false,
    })
  })

  it('includes admin label for admin users', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'a1',
      email: 'admin@test.com',
      name: 'Admin',
      isAdmin: true,
      emailVerified: true,
      archived: false,
      reminders: true,
      pushNotifications: false,
    } as any)

    const result = await handle({} as any)
    expect(result.labels).toContain('admin')
  })
})
