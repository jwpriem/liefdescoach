import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './request-password-reset.post'

vi.mock('h3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('h3')>()
  return {
    ...actual,
    createError: (opts: any) => {
      const err = new Error(opts.statusMessage)
      Object.assign(err, opts)
      return err
    },
    getRequestIP: vi.fn().mockReturnValue('127.0.0.1'),
  }
})

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
  beforeEach(async () => {
    const { getRequestIP } = await import('h3')
    vi.mocked(getRequestIP).mockReturnValue(`127.0.0.1-${Date.now()}`)
  })

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
    expect(smtpTransport.sendMail).toHaveBeenCalledOnce()
    expect(generateSignedToken).toHaveBeenCalled()
  })
})
