import { describe, it, expect, vi, beforeEach } from 'vitest'
import { asUser } from '../test-utils'
import { requireAdmin } from '../utils/auth'

vi.mock('h3', () => ({
  createError: (opts: any) => {
    const err = new Error(opts.statusMessage) as any
    err.statusCode = opts.statusCode
    err.statusMessage = opts.statusMessage
    return err
  },
}))

import handler from './studentCheck.post'

const mockDb = {
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('requireAdmin', requireAdmin)
  vi.stubGlobal('db', mockDb)
  vi.stubGlobal('readBody', vi.fn())

  mockDb.select.mockReturnValue(mockDb)
  mockDb.from.mockReturnValue(mockDb)
  mockDb.where.mockResolvedValue([])
})

const handle = handler as any
const fakeEvent = () => ({} as any)

describe('POST /api/studentCheck', () => {
  it('throws 403 when user is not an admin', async () => {
    asUser('user-1', { admin: false })
    vi.mocked(readBody).mockResolvedValue({ email: 'student@test.com' })

    await expect(handle(fakeEvent())).rejects.toThrow('Geen toegang')
  })

  it('throws 400 when email is missing or not a string', async () => {
    asUser('admin-1', { admin: true })
    vi.mocked(readBody).mockResolvedValue({ email: '' })

    await expect(handle(fakeEvent())).rejects.toThrow('E-mail is verplicht')
  })

  it('normalizes email with trim and lowercase before querying database', async () => {
    asUser('admin-1', { admin: true })
    vi.mocked(readBody).mockResolvedValue({ email: '  Student.Name@Example.COM  ' })
    mockDb.where.mockResolvedValue([
      { id: 's1', name: 'Student Name', email: 'student.name@example.com', phone: null, dateOfBirth: null }
    ])

    const res = await handle(fakeEvent())

    expect(res.total).toBe(1)
    expect(res.rows[0].email).toBe('student.name@example.com')
  })
})
