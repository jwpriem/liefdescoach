import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './send-otp.post'

vi.mock('h3', () => ({
  createError: (opts: any) => {
    const err = new Error(opts.statusMessage) as any
    err.statusCode = opts.statusCode
    err.statusMessage = opts.statusMessage
    return err
  },
  getRequestIP: vi.fn().mockReturnValue('127.0.0.1'),
}))

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

  it('returns success even when user does not exist (prevents enumeration)', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'noone@test.com' })
    mockDb.limit.mockResolvedValue([])

    const result = await handle({ node: { req: { headers: {} } } } as any)

    expect(result).toEqual({ success: true })
    expect(smtpTransport.sendMail).not.toHaveBeenCalled()
  })

  it('generates OTP and sends email when user exists', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: `user-${Date.now()}@test.com` }) // bypass email rate limit in tests
    mockDb.limit.mockResolvedValue([{ id: 'u1' }])

    const { getRequestIP } = await import('h3');
    vi.mocked(getRequestIP).mockReturnValue(`127.0.0.1-${Date.now()}`); // bypass IP rate limit in tests

    let waitUntilPromise: Promise<void> | null = null;
    const mockEvent = {
      node: { req: { headers: {} } },
      waitUntil: vi.fn((p) => { waitUntilPromise = p }),
    } as any;

    const result = await handle(mockEvent)

    // Wait for the background task to complete if it was scheduled
    if (waitUntilPromise) {
      await waitUntilPromise;
    }

    expect(result).toEqual({ success: true })
    expect(mockDb.delete).toHaveBeenCalled() // deletes old codes
    expect(mockDb.insert).toHaveBeenCalled() // inserts new code
    expect(smtpTransport.sendMail).toHaveBeenCalledOnce()
  })
})
