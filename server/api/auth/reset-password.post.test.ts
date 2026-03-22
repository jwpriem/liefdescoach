import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import handler from './reset-password.post'

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('db', mockDb)
  vi.stubGlobal('readBody', vi.fn())
  vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({ sessionSecret: 'test-secret' }))
  vi.stubGlobal('verifySignedToken', vi.fn().mockReturnValue({ userId: 'u1', email: 'user@test.com' }))

  mockDb.select.mockReturnThis()
  mockDb.from.mockReturnThis()
  mockDb.where.mockReturnThis()
  mockDb.limit.mockResolvedValue([{ id: 'u1' }])
  mockDb.update.mockReturnThis()
  mockDb.set.mockReturnThis()
})

const handle = typeof handler === 'function'
  ? handler
  : (handler as any).handler ?? handler

describe('POST /api/auth/reset-password', () => {
  it('throws 400 when token is missing', async () => {
    vi.mocked(readBody).mockResolvedValue({ password: 'newpass12' })
    await expect(handle({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when password is too short', async () => {
    vi.mocked(readBody).mockResolvedValue({ token: 'valid-token', password: 'short' })
    await expect(handle({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when user no longer exists', async () => {
    vi.mocked(readBody).mockResolvedValue({ token: 'valid-token', password: 'newpass12' })
    mockDb.limit.mockResolvedValue([])

    await expect(handle({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('hashes and stores new password on valid token', async () => {
    vi.mocked(readBody).mockResolvedValue({ token: 'valid-token', password: 'newpass12' })
    vi.spyOn(bcrypt, 'hash').mockResolvedValue('new-hash' as never)

    const result = await handle({} as any)

    expect(result).toEqual({ success: true })
    expect(verifySignedToken).toHaveBeenCalledWith('valid-token', 'test-secret', 'password-reset')
    expect(mockDb.update).toHaveBeenCalled()
  })
})
