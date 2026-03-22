import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './send-otp.post'

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
  delete: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue(undefined),
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('db', mockDb)
  vi.stubGlobal('readBody', vi.fn())
  vi.stubGlobal('generateId', vi.fn().mockReturnValue('otp-id'))
  vi.stubGlobal('smtpTransport', { sendMail: vi.fn().mockResolvedValue({}) })
  vi.stubGlobal('otpEmail', vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }))

  mockDb.select.mockReturnThis()
  mockDb.from.mockReturnThis()
  mockDb.where.mockReturnThis()
  mockDb.limit.mockResolvedValue([])
  mockDb.delete.mockReturnThis()
  mockDb.insert.mockReturnThis()
  mockDb.values.mockResolvedValue(undefined)
})

const handle = typeof handler === 'function'
  ? handler
  : (handler as any).handler ?? handler

describe('POST /api/auth/send-otp', () => {
  it('throws 400 when email is missing', async () => {
    vi.mocked(readBody).mockResolvedValue({})
    await expect(handle({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 404 when user does not exist', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'noone@test.com' })
    mockDb.limit.mockResolvedValue([])

    await expect(handle({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('generates OTP and sends email when user exists', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'user@test.com' })
    mockDb.limit.mockResolvedValue([{ id: 'u1' }])

    const result = await handle({} as any)

    expect(result).toEqual({ success: true })
    expect(mockDb.delete).toHaveBeenCalled() // deletes old codes
    expect(mockDb.insert).toHaveBeenCalled() // inserts new code
    expect(smtpTransport.sendMail).toHaveBeenCalledOnce()
  })
})
