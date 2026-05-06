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

import handler from './update-profile.post'

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

  mockDb.select.mockReturnValue(mockDb)
  mockDb.from.mockReturnValue(mockDb)
  mockDb.where.mockReturnValue(mockDb)
  mockDb.limit.mockResolvedValue([])

  mockDb.insert.mockImplementation(() => ({
    values: vi.fn().mockImplementation(() => ({
      returning: vi.fn().mockResolvedValue([{ name: 'Created' }])
    }))
  }))

  mockDb.update.mockImplementation(() => ({
    set: vi.fn().mockImplementation(() => ({
      where: vi.fn().mockImplementation(() => ({
        returning: vi.fn().mockResolvedValue([{ name: 'Updated' }])
      }))
    }))
  }))
})

const handle = handler as any
const fakeEvent = () => ({} as any)

describe('POST /api/students/update-profile self-healing', () => {
  it('allows self-healing when user updates OWN profile', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
        $id: 'user-123',
        email: 'user@test.com',
        name: 'Test User',
        labels: []
    })
    vi.mocked(readBody).mockResolvedValue({ name: 'New Name' })
    mockDb.limit.mockResolvedValue([]) // Not existing

    const result = await handle(fakeEvent())

    expect(result.success).toBe(true)
    expect(mockDb.insert).toHaveBeenCalled()
  })

  it('throws 404 when ADMIN tries to update NON-EXISTENT user (prevents leak)', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
        $id: 'admin-id',
        email: 'admin@test.com',
        name: 'Admin User',
        labels: ['admin']
    })
    vi.mocked(readBody).mockResolvedValue({ userId: 'other-id', name: 'New Name' })
    mockDb.limit.mockResolvedValue([]) // Not existing

    await expect(handle(fakeEvent())).rejects.toMatchObject({ statusCode: 404 })
    expect(mockDb.insert).not.toHaveBeenCalled()
  })
})
