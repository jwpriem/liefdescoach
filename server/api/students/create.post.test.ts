import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock h3
vi.mock('h3', () => ({
  createError: (opts: any) => {
    const err = new Error(opts.statusMessage) as any
    err.statusCode = opts.statusCode
    err.statusMessage = opts.statusMessage
    return err
  },
}))

import handler from './create.post'

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
  insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) }),
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('db', mockDb)
  vi.stubGlobal('readBody', vi.fn())
  vi.stubGlobal('requireAuth', vi.fn())

  mockDb.select.mockReturnThis()
  mockDb.from.mockReturnThis()
  mockDb.where.mockReturnThis()
  mockDb.limit.mockResolvedValue([])
  mockDb.insert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) })
})

const handle = handler as any
const fakeEvent = () => ({} as any)

describe('POST /api/students/create', () => {
  it('throws 401 when NOT authenticated', async () => {
    vi.mocked(requireAuth).mockImplementation(() => {
        throw createError({ statusCode: 401, statusMessage: 'Niet ingelogd' })
    })
    vi.mocked(readBody).mockResolvedValue({
      userId: 'hacker-id',
      email: 'hacker@example.com',
      name: 'Hacker'
    })

    await expect(handle(fakeEvent())).rejects.toMatchObject({ statusCode: 401 })
  })

  it('creates student using authUser data when authenticated', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
        $id: 'user-123',
        email: 'user@test.com',
        name: 'Test User',
        labels: []
    })
    vi.mocked(readBody).mockResolvedValue({})

    const result = await handle(fakeEvent())

    expect(result).toEqual({ success: true, studentId: 'user-123' })
    expect(mockDb.insert).toHaveBeenCalled()
    // More detailed check on what's passed to values
    const valuesCall = mockDb.insert.mock.results[0].value.values.mock.calls[0][0]
    expect(valuesCall).toMatchObject({
        id: 'user-123',
        email: 'user@test.com',
        name: 'Test User'
    })
  })
})
