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

import handler from './handleBooking.post'

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  insert: vi.fn(),
  update: vi.fn(),
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('db', mockDb)
  vi.stubGlobal('readBody', vi.fn())
  vi.stubGlobal('requireAuth', vi.fn())
  vi.stubGlobal('findAvailableCredit', vi.fn())
  vi.stubGlobal('generateId', vi.fn().mockReturnValue('new-booking-id'))
  vi.stubGlobal('countRegularLessonBookings', vi.fn())

  mockDb.select.mockReturnThis()
  mockDb.from.mockReturnThis()
  mockDb.leftJoin.mockReturnThis()
  mockDb.where.mockReturnThis()
  mockDb.insert.mockReturnValue({ values: vi.fn().mockResolvedValue([]) })
  mockDb.update.mockReturnValue({ set: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([]) })
})

const handle = handler as any
const fakeEvent = () => ({}) as any

describe('POST /api/handleBooking', () => {
  it('throws 400 when lessonId is missing', async () => {
    vi.mocked(requireAuth).mockResolvedValue({ $id: 'u1', labels: [] })
    vi.mocked(readBody).mockResolvedValue({})
    await expect(handle(fakeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('successfully books a regular lesson', async () => {
    const futureDate = new Date(Date.now() + 86400000)
    vi.mocked(requireAuth).mockResolvedValue({ $id: 'u1', labels: [] })
    vi.mocked(readBody).mockResolvedValue({ lessonId: 'l1' })
    vi.mocked(findAvailableCredit).mockResolvedValue({ id: 'c1' })

    // Mock the joined query result: 1 lesson, 0 existing bookings
    mockDb.where.mockResolvedValue([
      { id: 'l1', date: futureDate, maxSpots: 9, type: 'hatha yoga', teacher: 'Ravennah', bookingId: null }
    ])

    const result = await handle(fakeEvent())

    expect(result.success).toBe(true)
    expect(result.spots).toBe(8) // 9 - 1
    expect(mockDb.insert).toHaveBeenCalled()
    expect(mockDb.update).toHaveBeenCalled() // Credit used
  })

  it('throws 409 when lesson is full for regular booking', async () => {
    const futureDate = new Date(Date.now() + 86400000)
    vi.mocked(requireAuth).mockResolvedValue({ $id: 'u2', labels: [] })
    vi.mocked(readBody).mockResolvedValue({ lessonId: 'l1' })

    // 9 spots, 9 regular bookings already
    const rows = Array.from({ length: 9 }, (_, i) => ({
      id: 'l1', date: futureDate, maxSpots: 9, type: 'hatha yoga', teacher: 'Ravennah',
      bookingId: `b${i}`, bookingStudentId: `s${i}`, bookingSource: 'regular'
    }))
    mockDb.where.mockResolvedValue(rows)

    await expect(handle(fakeEvent())).rejects.toMatchObject({ statusCode: 409, statusMessage: 'Les is vol' })
  })

  it('allows classpass booking even if lesson is full', async () => {
    const futureDate = new Date(Date.now() + 86400000)
    vi.mocked(requireAuth).mockResolvedValue({ $id: 'admin1', labels: ['admin'] })
    vi.mocked(readBody).mockResolvedValue({ lessonId: 'l1', source: 'classpass', onBehalfOfUserId: 'u2' })

    // 9 spots, 9 regular bookings
    const rows = Array.from({ length: 9 }, (_, i) => ({
      id: 'l1', date: futureDate, maxSpots: 9, type: 'hatha yoga', teacher: 'Ravennah',
      bookingId: `b${i}`, bookingStudentId: `s${i}`, bookingSource: 'regular'
    }))
    mockDb.where.mockResolvedValue(rows)

    const result = await handle(fakeEvent())

    expect(result.success).toBe(true)
    expect(result.source).toBe('classpass')
    expect(result.spots).toBe(0) // spots left for regular bookings remains 0
    expect(mockDb.update).not.toHaveBeenCalled() // No credit used for classpass
  })

  it('throws 409 if already booked', async () => {
    const futureDate = new Date(Date.now() + 86400000)
    vi.mocked(requireAuth).mockResolvedValue({ $id: 'u1', labels: [] })
    vi.mocked(readBody).mockResolvedValue({ lessonId: 'l1' })

    mockDb.where.mockResolvedValue([
      { id: 'l1', date: futureDate, maxSpots: 9, type: 'hatha yoga', teacher: 'Ravennah', bookingId: 'b1', bookingStudentId: 'u1', bookingSource: 'regular' }
    ])

    await expect(handle(fakeEvent())).rejects.toMatchObject({ statusCode: 409, statusMessage: 'Gebruiker is al geboekt voor deze les' })
  })

  it('allows duplicate booking if extraSpot is true', async () => {
    const futureDate = new Date(Date.now() + 86400000)
    vi.mocked(requireAuth).mockResolvedValue({ $id: 'u1', labels: [] })
    vi.mocked(readBody).mockResolvedValue({ lessonId: 'l1', extraSpot: true })
    vi.mocked(findAvailableCredit).mockResolvedValue({ id: 'c1' })

    mockDb.where.mockResolvedValue([
      { id: 'l1', date: futureDate, maxSpots: 9, type: 'hatha yoga', teacher: 'Ravennah', bookingId: 'b1', bookingStudentId: 'u1', bookingSource: 'regular' }
    ])

    const result = await handle(fakeEvent())
    expect(result.success).toBe(true)
    expect(result.spots).toBe(7) // 9 - (1 existing + 1 new)
  })

  it('throws 400 for past lesson', async () => {
    const pastDate = new Date(Date.now() - 86400000)
    vi.mocked(requireAuth).mockResolvedValue({ $id: 'u1', labels: [] })
    vi.mocked(readBody).mockResolvedValue({ lessonId: 'l1' })

    mockDb.where.mockResolvedValue([
      { id: 'l1', date: pastDate, maxSpots: 9, type: 'hatha yoga', teacher: 'Ravennah', bookingId: null }
    ])

    await expect(handle(fakeEvent())).rejects.toMatchObject({ statusCode: 400, statusMessage: 'Kan niet boeken voor een les in het verleden' })
  })

  it('allows admin to book past lesson for student', async () => {
    const pastDate = new Date(Date.now() - 86400000)
    vi.mocked(requireAuth).mockResolvedValue({ $id: 'admin1', labels: ['admin'] })
    vi.mocked(readBody).mockResolvedValue({ lessonId: 'l1', onBehalfOfUserId: 'u2' })
    vi.mocked(findAvailableCredit).mockResolvedValue({ id: 'c1' })

    mockDb.where.mockResolvedValue([
      { id: 'l1', date: pastDate, maxSpots: 9, type: 'hatha yoga', teacher: 'Ravennah', bookingId: null }
    ])

    const result = await handle(fakeEvent())
    expect(result.success).toBe(true)
  })
})
