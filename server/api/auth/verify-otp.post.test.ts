import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler, { resetVerifyOtpAttempts } from './verify-otp.post'

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue([]),
  delete: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('db', mockDb)
  vi.stubGlobal('readBody', vi.fn())
  vi.stubGlobal('createSession', vi.fn())
  vi.stubGlobal('getRequestIP', vi.fn().mockReturnValue('127.0.0.1'))

  mockDb.select.mockReturnThis()
  mockDb.from.mockReturnThis()
  mockDb.where.mockResolvedValue([])
  mockDb.delete.mockReturnThis()
  mockDb.update.mockReturnThis()
  mockDb.set.mockReturnThis()

  resetVerifyOtpAttempts()
})

const handle = typeof handler === 'function'
  ? handler
  : (handler as any).handler ?? handler

describe('POST /api/auth/verify-otp', () => {
  it('throws 400 when email is missing', async () => {
    vi.mocked(readBody).mockResolvedValue({ code: '123456' })
    await expect(handle({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when code is missing', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'user@test.com' })
    await expect(handle({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 401 with generic error when no OTP code found', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'user@test.com', code: '123456' })
    mockDb.where.mockResolvedValue([])

    await expect(handle({} as any)).rejects.toMatchObject({
        statusCode: 401,
        statusMessage: 'Ongeldige of verlopen code. Vraag een nieuwe code aan.'
    })
  })

  it('throws 401 with generic error when OTP is expired', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'user@test.com', code: '123456' })
    mockDb.where.mockResolvedValue([{
      id: 'otp1',
      code: '123456',
      userId: 'u1',
      expiresAt: new Date(Date.now() - 60000), // expired 1 minute ago
    }])

    await expect(handle({} as any)).rejects.toMatchObject({
        statusCode: 401,
        statusMessage: 'Ongeldige of verlopen code. Vraag een nieuwe code aan.'
    })
    expect(mockDb.delete).toHaveBeenCalled()
  })

  it('throws 401 with generic error when OTP code is wrong', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'user@test.com', code: '000000' })
    mockDb.where.mockResolvedValue([{
      id: 'otp1',
      code: '123456',
      userId: 'u1',
      expiresAt: new Date(Date.now() + 600000),
    }])

    await expect(handle({} as any)).rejects.toMatchObject({
        statusCode: 401,
        statusMessage: 'Ongeldige of verlopen code. Vraag een nieuwe code aan.'
    })
    expect(mockDb.delete).toHaveBeenCalled()
  })

  it('creates session and returns success on valid OTP', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'user@test.com', code: '123456' })
    mockDb.where.mockResolvedValue([{
      id: 'otp1',
      code: '123456',
      userId: 'u1',
      expiresAt: new Date(Date.now() + 600000),
    }])

    const event = {} as any
    const result = await handle(event)

    expect(result).toMatchObject({ success: true, userId: 'u1' })
    expect(mockDb.update).toHaveBeenCalled()
    expect(mockDb.set).toHaveBeenCalledWith({ emailVerified: true })
    expect(createSession).toHaveBeenCalledWith(event, 'u1')
  })

  it('rate limits verification attempts by IP', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'user@test.com', code: 'wrong' })
    mockDb.where.mockResolvedValue([])

    // 5 attempts allowed
    for (let i = 0; i < 5; i++) {
        await expect(handle({} as any)).rejects.toMatchObject({ statusCode: 401 })
    }

    // 6th attempt should be rate limited
    await expect(handle({} as any)).rejects.toMatchObject({
        statusCode: 429,
        statusMessage: 'Te veel pogingen vanaf dit IP. Probeer het later opnieuw.'
    })
  })
})
