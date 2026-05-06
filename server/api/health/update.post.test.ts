import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock h3
vi.mock('h3', () => ({
  createError: (opts: any) => {
    const err = new Error(opts.statusMessage) as any
    err.statusCode = opts.statusCode
    err.statusMessage = opts.statusMessage
    return err
  },
}))

import handler from './update.post'

const mockDb = {
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('db', mockDb)
  vi.stubGlobal('readBody', vi.fn())
  vi.stubGlobal('requireAuth', vi.fn())
  vi.stubGlobal('generateId', vi.fn().mockReturnValue('new-id'))

  mockDb.select.mockReturnValue(mockDb)
  mockDb.from.mockReturnValue(mockDb)
  mockDb.where.mockReturnValue(mockDb)
  mockDb.limit.mockResolvedValue([])

  mockDb.insert.mockImplementation(() => ({
    values: vi.fn().mockImplementation(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 'new-id' }])
    }))
  }))

  mockDb.update.mockImplementation(() => ({
    set: vi.fn().mockImplementation(() => ({
      where: vi.fn().mockImplementation(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 'updated-id' }])
      }))
    }))
  }))
})

const handle = handler as any
const fakeEvent = () => ({} as any)

describe('POST /api/health/update self-healing', () => {
  it('allows self-healing when user updates OWN profile', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
        $id: 'user-123',
        email: 'user@test.com',
        name: 'Test User',
        labels: []
    })
    vi.mocked(readBody).mockResolvedValue({ userId: 'user-123', injury: 'None' })
    mockDb.limit.mockResolvedValue([]) // Student not existing

    const result = await handle(fakeEvent())

    expect(result.result).toBeDefined()
    expect(mockDb.insert).toHaveBeenCalled()
  })

  it('throws 404 when ADMIN tries to update health of NON-EXISTENT student', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
        $id: 'admin-id',
        email: 'admin@test.com',
        name: 'Admin User',
        labels: ['admin']
    })
    vi.mocked(readBody).mockResolvedValue({ userId: 'other-id', injury: 'None' })
    mockDb.limit.mockResolvedValue([]) // Student not existing

    await expect(handle(fakeEvent())).rejects.toMatchObject({ statusCode: 404 })
    expect(mockDb.insert).not.toHaveBeenCalled()
  })
})
