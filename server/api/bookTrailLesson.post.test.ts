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

import handler from './bookTrailLesson.post'

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
  vi.stubGlobal('requireAdmin', vi.fn())
  vi.stubGlobal('getLessonWithBookings', vi.fn())
  vi.stubGlobal('countLessonBookings', vi.fn())
  vi.stubGlobal('generateId', vi.fn().mockReturnValue('gen-id-123'))

  mockDb.select.mockReturnThis()
  mockDb.from.mockReturnThis()
  mockDb.where.mockReturnThis()
  mockDb.limit.mockResolvedValue([])
  mockDb.insert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) })
})

const handle = handler as any
const fakeEvent = () => ({} as any)

describe('POST /api/bookTrailLesson', () => {
  it('throws 403 when user is not admin', async () => {
    vi.mocked(requireAdmin).mockImplementation(() => {
      throw createError({ statusCode: 403, statusMessage: 'Geen toegang' })
    })

    await expect(handle(fakeEvent())).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 400 when missing required fields', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ $id: 'admin-1', email: 'admin@test.com', name: 'Admin', labels: ['admin'] })
    vi.mocked(readBody).mockResolvedValue({ name: 'Proef', email: '' })

    await expect(handle(fakeEvent())).rejects.toMatchObject({ statusCode: 400, statusMessage: 'E-mail is verplicht' })
  })

  it('throws 404 when lesson is not found', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ $id: 'admin-1', email: 'admin@test.com', name: 'Admin', labels: ['admin'] })
    vi.mocked(readBody).mockResolvedValue({ name: 'Proef', email: 'proef@test.com', lessonId: 'invalid-lesson' })
    vi.mocked(getLessonWithBookings).mockResolvedValue(null)

    await expect(handle(fakeEvent())).rejects.toMatchObject({ statusCode: 404, statusMessage: 'Les niet gevonden' })
  })

  it('throws 409 when lesson is full', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ $id: 'admin-1', email: 'admin@test.com', name: 'Admin', labels: ['admin'] })
    vi.mocked(readBody).mockResolvedValue({ name: 'Proef', email: 'proef@test.com', lessonId: 'full-lesson' })
    vi.mocked(getLessonWithBookings).mockResolvedValue({ id: 'full-lesson', maxSpots: 9 })
    vi.mocked(countLessonBookings).mockResolvedValue(9)

    await expect(handle(fakeEvent())).rejects.toMatchObject({ statusCode: 409, statusMessage: 'Les is vol' })
  })

  it('creates new student with normalized email when student does not exist', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ $id: 'admin-1', email: 'admin@test.com', name: 'Admin', labels: ['admin'] })
    vi.mocked(readBody).mockResolvedValue({ name: '  Jan Jansen  ', email: '  JAN@EXAMPLE.COM ', lessonId: 'lesson-1' })
    vi.mocked(getLessonWithBookings).mockResolvedValue({ id: 'lesson-1', maxSpots: 9 })
    vi.mocked(countLessonBookings).mockResolvedValue(2)
    mockDb.limit.mockResolvedValue([]) // No existing student found

    const res = await handle(fakeEvent())

    expect(res).toEqual({
      $id: 'gen-id-123',
      lessons: 'lesson-1',
      students: 'gen-id-123',
    })

    // Verify student insert with normalized email
    const studentInsertCall = mockDb.insert.mock.results[0].value.values.mock.calls[0][0]
    expect(studentInsertCall).toEqual({
      id: 'gen-id-123',
      name: 'Jan Jansen (Proefles)',
      email: 'jan@example.com',
    })
  })

  it('reuses existing student ID when student with email already exists', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ $id: 'admin-1', email: 'admin@test.com', name: 'Admin', labels: ['admin'] })
    vi.mocked(readBody).mockResolvedValue({ name: 'Jan Jansen', email: 'jan@example.com', lessonId: 'lesson-1' })
    vi.mocked(getLessonWithBookings).mockResolvedValue({ id: 'lesson-1', maxSpots: 9 })
    vi.mocked(countLessonBookings).mockResolvedValue(2)
    mockDb.limit.mockResolvedValue([{ id: 'existing-student-999' }]) // Existing student found

    const res = await handle(fakeEvent())

    expect(res).toEqual({
      $id: 'gen-id-123',
      lessons: 'lesson-1',
      students: 'existing-student-999',
    })

    // Should NOT insert into students table, only bookings table
    expect(mockDb.insert).toHaveBeenCalledTimes(1)
  })
})
