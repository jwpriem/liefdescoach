import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './request-password-reset.post'

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('db', mockDb)
  vi.stubGlobal('readBody', vi.fn())
  vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({ sessionSecret: 'test-secret' }))
  vi.stubGlobal('generateSignedToken', vi.fn().mockReturnValue('signed-token'))
  vi.stubGlobal('smtpTransport', { sendMail: vi.fn().mockResolvedValue({}) })
  vi.stubGlobal('passwordResetEmail', vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }))
  vi.stubGlobal('getHeader', vi.fn().mockReturnValue('https://ravennah.com'))

  mockDb.select.mockReturnThis()
  mockDb.from.mockReturnThis()
  mockDb.where.mockReturnThis()
  mockDb.limit.mockResolvedValue([])
})

const handle = typeof handler === 'function'
  ? handler
  : (handler as any).handler ?? handler

describe('POST /api/auth/request-password-reset', () => {
  it('throws 400 when email is missing', async () => {
    vi.mocked(readBody).mockResolvedValue({})
    await expect(handle({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns success even when email is not found (prevents enumeration)', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'unknown@test.com' })
    mockDb.limit.mockResolvedValue([])

    const result = await handle({} as any)

    expect(result).toEqual({ success: true })
    expect(smtpTransport.sendMail).not.toHaveBeenCalled()
  })

  it('sends reset email when user exists', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'user@test.com' })
    mockDb.limit.mockResolvedValue([{ id: 'u1', email: 'user@test.com' }])

    const result = await handle({} as any)

    expect(result).toEqual({ success: true })
    expect(smtpTransport.sendMail).toHaveBeenCalledOnce()
    expect(generateSignedToken).toHaveBeenCalled()
  })
})
