import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import handler from './update-password.post'

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
}

const mockUser = { $id: 'u1', email: 'user@test.com', name: 'User', labels: [] }

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('db', mockDb)
  vi.stubGlobal('readBody', vi.fn())
  vi.stubGlobal('requireAuth', vi.fn().mockResolvedValue(mockUser))

  mockDb.select.mockReturnThis()
  mockDb.from.mockReturnThis()
  mockDb.where.mockReturnThis()
  mockDb.limit.mockResolvedValue([])
  mockDb.update.mockReturnThis()
  mockDb.set.mockReturnThis()

  // Change user ID to prevent rate limiting cross-talk between tests
  mockUser.$id = `u-${Date.now()}-${Math.random()}`
})

const handle = typeof handler === 'function'
  ? handler
  : (handler as any).handler ?? handler

describe('POST /api/auth/update-password', () => {
  it('throws 400 when current password is missing', async () => {
    vi.mocked(readBody).mockResolvedValue({ newPassword: 'newpass12' })
    await expect(handle({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when new password is too short', async () => {
    vi.mocked(readBody).mockResolvedValue({ password: 'current1', newPassword: 'short' })
    await expect(handle({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 404 when user is not found in db', async () => {
    vi.mocked(readBody).mockResolvedValue({ password: 'current1', newPassword: 'newpass12' })
    mockDb.limit.mockResolvedValue([])
    await expect(handle({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 401 when current password is wrong', async () => {
    vi.mocked(readBody).mockResolvedValue({ password: 'wrong', newPassword: 'newpass12' })
    mockDb.limit.mockResolvedValue([{ passwordHash: '$2a$12$hash' }])
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never)

    await expect(handle({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when passwordHash is null (not migrated)', async () => {
    vi.mocked(readBody).mockResolvedValue({ password: 'anything', newPassword: 'newpass12' })
    mockDb.limit.mockResolvedValue([{ passwordHash: null }])

    await expect(handle({} as any)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: expect.stringContaining('wachtwoord-herstellen'),
    })
  })

  it('updates password on valid request', async () => {
    vi.mocked(readBody).mockResolvedValue({ password: 'correct', newPassword: 'newpass12' })
    mockDb.limit.mockResolvedValue([{ passwordHash: '$2a$12$hash' }])
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)
    vi.spyOn(bcrypt, 'hash').mockResolvedValue('new-hash' as never)

    const result = await handle({} as any)

    expect(result).toEqual({ success: true })
    expect(mockDb.update).toHaveBeenCalled()
  })
})
