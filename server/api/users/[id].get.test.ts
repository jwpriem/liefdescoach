import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './[id].get'

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('requireAdmin', vi.fn())
  vi.stubGlobal('getRouterParam', vi.fn(() => 'test-user-id'))
  vi.stubGlobal('db', {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
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

describe('GET /api/users/[id]', () => {
  it('calls requireAdmin', async () => {
    await handle({} as any).catch(() => {})
    expect(requireAdmin).toHaveBeenCalled()
  })

  it('throws 400 if user ID is missing', async () => {
    vi.mocked(getRouterParam).mockReturnValue(undefined)

    await expect(handle({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 404 if user is not found', async () => {
    vi.mocked(db.limit).mockResolvedValue([])

    await expect(handle({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns formatted user details when user exists', async () => {
    const mockUserRow = {
      id: 'test-user-id',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+31612345678',
      dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
      isAdmin: false,
      emailVerified: true,
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      archived: false,
      reminders: true,
      phoneRequested: false,
      healthId: 'health-1',
      injury: 'No injury',
      pregnancy: false,
      dueDate: null,
    }
    vi.mocked(db.limit).mockResolvedValue([mockUserRow])

    const result = await handle({} as any)

    expect(result).toEqual({
      user: {
        $id: 'test-user-id',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+31612345678',
        dateOfBirth: '1990-01-01T00:00:00.000Z',
        labels: [],
        emailVerification: true,
        registration: '2023-01-01T00:00:00.000Z',
        archived: false,
        reminders: true,
        phoneRequested: false,
        health: {
          $id: 'health-1',
          injury: 'No injury',
          pregnancy: false,
          dueDate: null,
        }
      }
    })
  })
})
