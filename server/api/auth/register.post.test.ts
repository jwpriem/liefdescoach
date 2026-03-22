import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import handler from './register.post'

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue(undefined),
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('db', mockDb)
  vi.stubGlobal('readBody', vi.fn())
  vi.stubGlobal('createSession', vi.fn())
  vi.stubGlobal('generateId', vi.fn().mockReturnValue('new-id'))

  mockDb.select.mockReturnThis()
  mockDb.from.mockReturnThis()
  mockDb.where.mockReturnThis()
  mockDb.limit.mockResolvedValue([])
  mockDb.insert.mockReturnThis()
  mockDb.values.mockResolvedValue(undefined)
})

const handle = typeof handler === 'function'
  ? handler
  : (handler as any).handler ?? handler

describe('POST /api/auth/register', () => {
  const validBody = { email: 'new@test.com', password: 'password8', name: 'Test User' }

  it('throws 400 when email is missing', async () => {
    vi.mocked(readBody).mockResolvedValue({ password: 'test1234', name: 'Test' })
    await expect(handle({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when password is too short', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'a@b.com', password: 'short', name: 'Test' })
    await expect(handle({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when name is missing', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'a@b.com', password: 'password8' })
    await expect(handle({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when name is too short', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'a@b.com', password: 'password8', name: 'A' })
    await expect(handle({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 409 when email already exists', async () => {
    vi.mocked(readBody).mockResolvedValue(validBody)
    mockDb.limit.mockResolvedValue([{ id: 'existing' }])

    await expect(handle({} as any)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('creates user and session on valid registration', async () => {
    vi.mocked(readBody).mockResolvedValue(validBody)
    mockDb.limit.mockResolvedValue([])
    vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-pw' as never)

    const event = {} as any
    const result = await handle(event)

    expect(result).toMatchObject({ success: true, user: { $id: 'new-id', email: 'new@test.com' } })
    expect(mockDb.insert).toHaveBeenCalled()
    expect(createSession).toHaveBeenCalledWith(event, 'new-id')
  })

  it('throws 400 for invalid phone number format', async () => {
    vi.mocked(readBody).mockResolvedValue({ ...validBody, phone: 'abc' })
    await expect(handle({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })
})
