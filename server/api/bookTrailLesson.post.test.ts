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

import handler from './bookTrailLesson.post'

const mockDb = {
  insert: vi.fn(() => ({
    values: vi.fn().mockResolvedValue([]),
  })),
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('requireAdmin', requireAdmin)
  vi.stubGlobal('db', mockDb)
  vi.stubGlobal('readBody', vi.fn())
  vi.stubGlobal('generateId', vi.fn().mockReturnValue('generated-id'))
  vi.stubGlobal('getLessonWithBookings', vi.fn())
  vi.stubGlobal('countLessonBookings', vi.fn())
})

const handle = handler as any
const fakeEvent = () => ({} as any)

describe('POST /api/bookTrailLesson', () => {
  it('throws 403 when user is not an admin', async () => {
    asUser('user-1', { admin: false })
    vi.mocked(readBody).mockResolvedValue({ name: 'Test', email: 'test@example.com', lessonId: 'l1' })

    await expect(handle(fakeEvent())).rejects.toThrow('Geen toegang')
  })

  it('normalizes email and name with trim and lowercase before insertion', async () => {
    asUser('admin-1', { admin: true })
    vi.mocked(readBody).mockResolvedValue({
      name: '  Anna Smith ',
      email: '  Anna.Smith@EXAMPLE.com  ',
      lessonId: 'lesson-123',
    })

    vi.stubGlobal('getLessonWithBookings', vi.fn().mockResolvedValue({ maxSpots: 10 }))
    vi.stubGlobal('countLessonBookings', vi.fn().mockResolvedValue(2))

    const insertValues: any[] = []
    mockDb.insert.mockImplementation(() => ({
      values: vi.fn().mockImplementation((val) => {
        insertValues.push(val)
        return Promise.resolve([])
      }),
    }))

    const res = await handle(fakeEvent())

    expect(res.$id).toBe('generated-id')
    expect(insertValues).toHaveLength(2)
    // First insert is into students table
    expect(insertValues[0]).toEqual({
      id: 'generated-id',
      name: 'Anna Smith (Proefles)',
      email: 'anna.smith@example.com',
    })
  })
})
