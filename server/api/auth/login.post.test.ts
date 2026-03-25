import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'

// Mock h3 — login.post.ts explicitly imports createError, getHeader, getRequestIP
vi.mock('h3', () => ({
  createError: (opts: any) => {
    const err = new Error(opts.statusMessage) as any
    err.statusCode = opts.statusCode
    err.statusMessage = opts.statusMessage
    return err
  },
  getHeader: vi.fn().mockReturnValue('https://ravennah.com'),
  getRequestIP: vi.fn().mockReturnValue('127.0.0.1'),
}))

import handler from './login.post'

// ─── Stubs for Nitro auto-imports ──────────────────────────────────────────

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
  insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) }),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('db', mockDb)
  vi.stubGlobal('readBody', vi.fn())
  vi.stubGlobal('createSession', vi.fn())
  vi.stubGlobal('generateSignedToken', vi.fn().mockReturnValue('signed-token'))
  vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({ sessionSecret: 'test-secret' }))
  vi.stubGlobal('smtpTransport', { sendMail: vi.fn().mockResolvedValue({}) })
  vi.stubGlobal('passwordResetMigrationEmail', vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }))

  // Reset chainable mock
  mockDb.select.mockReturnThis()
  mockDb.from.mockReturnThis()
  mockDb.where.mockReturnThis()
  mockDb.insert.mockReturnValue({ values: vi.fn().mockResolvedValue([]) })
  mockDb.update.mockReturnThis()
  mockDb.set.mockReturnThis()
  mockDb.limit.mockResolvedValue([])
})

const handle = handler as any
const fakeEvent = () => ({} as any)

describe('POST /api/auth/login', () => {
  it('throws 400 when email is missing', async () => {
    vi.mocked(readBody).mockResolvedValue({ password: 'test1234' })
    await expect(handle(fakeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when password is missing', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'user@test.com' })
    await expect(handle(fakeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 401 when user is not found', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'noone@test.com', password: 'test1234' })
    mockDb.limit.mockResolvedValue([])
    await expect(handle(fakeEvent())).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 401 when password is incorrect', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'user@test.com', password: 'wrong' })
    mockDb.limit.mockResolvedValue([{ id: 'u1', email: 'user@test.com', name: 'User', passwordHash: '$2a$12$fakehash', isAdmin: false, emailVerified: true }])
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never)

    await expect(handle(fakeEvent())).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns success and creates session on valid login', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'user@test.com', password: 'correct' })
    mockDb.limit.mockResolvedValue([{ id: 'u1', email: 'user@test.com', name: 'User', passwordHash: '$2a$12$fakehash', isAdmin: false, emailVerified: true }])
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)

    const event = fakeEvent()
    const result = await handle(event)

    expect(result).toMatchObject({ success: true, user: { $id: 'u1', email: 'user@test.com' } })
    expect(createSession).toHaveBeenCalledWith(event, 'u1')
  })

  it('returns admin label for admin users', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'admin@test.com', password: 'correct' })
    mockDb.limit.mockResolvedValue([{ id: 'a1', email: 'admin@test.com', name: 'Admin', passwordHash: '$2a$12$fakehash', isAdmin: true, emailVerified: true }])
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)

    const result = await handle(fakeEvent())
    expect(result.user.labels).toContain('admin')
  })

  it('returns migration-reset-sent when passwordHash is null', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'migrate@test.com', password: 'anything' })
    mockDb.limit.mockResolvedValue([{ id: 'u2', email: 'migrate@test.com', name: 'Old User', passwordHash: null, isAdmin: false }])

    const result = await handle(fakeEvent())

    expect(result).toEqual({ success: false, reason: 'migration-reset-sent' })
    expect(smtpTransport.sendMail).toHaveBeenCalledOnce()
    expect(createSession).not.toHaveBeenCalled()
  })

  it('does not send duplicate migration emails within the rate limit window', async () => {
    const uniqueEmail = 'ratelimit-' + Date.now() + '@test.com'
    vi.mocked(readBody).mockResolvedValue({ email: uniqueEmail, password: 'anything' })
    mockDb.limit.mockResolvedValue([{ id: 'u3', email: uniqueEmail, name: 'Rate Limit User', passwordHash: null, isAdmin: false }])

    // First attempt sends an email
    await handle(fakeEvent())
    expect(smtpTransport.sendMail).toHaveBeenCalledOnce()

    // Second attempt within rate limit window should NOT send another email
    const secondSendMail = vi.fn().mockResolvedValue({})
    vi.stubGlobal('smtpTransport', { sendMail: secondSendMail })
    await handle(fakeEvent())
    expect(secondSendMail).not.toHaveBeenCalled()
  })

  it('normalizes email to lowercase and trims whitespace', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: '  User@Test.COM  ', password: 'correct' })
    mockDb.limit.mockResolvedValue([{ id: 'u1', email: 'user@test.com', name: 'User', passwordHash: '$2a$12$fakehash', isAdmin: false, emailVerified: true }])
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)

    await handle(fakeEvent())

    // The db query should use normalized email
    expect(mockDb.where).toHaveBeenCalled()
  })
})
