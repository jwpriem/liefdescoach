import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './me.get'

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('getSessionUser', vi.fn())
  vi.stubGlobal('db', {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  })
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

  it('returns consolidated user data for authenticated user', async () => {
    const mockUser = {
      userId: 'u1',
      email: 'user@test.com',
      name: 'Test User',
      isAdmin: false,
      emailVerified: true,
      archived: false,
      reminders: true,
      pushNotifications: false,
      dateOfBirth: new Date('1990-01-01'),
      phone: '0612345678',
      phoneRequested: false,
      registration: new Date('2023-01-01'),
    }
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as any)

    const mockHealth = {
      id: 'h1',
      studentId: 'u1',
      injury: 'None',
      pregnancy: false,
      dueDate: null,
    }
    vi.mocked(db.limit).mockResolvedValue([mockHealth])

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
      dateOfBirth: mockUser.dateOfBirth.toISOString(),
      phone: '0612345678',
      phoneRequested: false,
      registration: mockUser.registration.toISOString(),
      health: {
        $id: 'h1',
        injury: 'None',
        pregnancy: false,
        dueDate: null,
      },
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
