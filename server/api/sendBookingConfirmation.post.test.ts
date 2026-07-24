import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock h3
vi.mock('h3', () => ({
  createError: (opts: any) => {
    const err = new Error(opts.statusMessage) as any
    err.statusCode = opts.statusCode
    err.statusMessage = opts.statusMessage
    return err
  },
  defineEventHandler: (handler: any) => handler,
  readBody: vi.fn(),
  setResponseStatus: vi.fn(),
}))

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
    eq: vi.fn(),
    and: vi.fn(),
    isNull: vi.fn(),
    gt: vi.fn(),
}))

import handler from './sendBookingConfirmation.post'

const mockDb = {
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  leftJoin: vi.fn(),
  limit: vi.fn(),
}

const mockSmtp = {
    sendMail: vi.fn().mockResolvedValue({ accepted: true })
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('db', mockDb)
  vi.stubGlobal('requireAuth', vi.fn())
  vi.stubGlobal('setResponseStatus', vi.fn())
  vi.stubGlobal('smtpTransport', mockSmtp)
  vi.stubGlobal('sendPushToAdmins', vi.fn())
  vi.stubGlobal('formatLessonDate', vi.fn().mockReturnValue('mocked date'))
  vi.stubGlobal('formatISODate', vi.fn())
  vi.stubGlobal('formatHour', vi.fn())
  vi.stubGlobal('formatMinutes', vi.fn())
  vi.stubGlobal('bookingStudentEmail', vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }))
  vi.stubGlobal('bookingAdminEmail', vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }))

  mockDb.select.mockReturnValue(mockDb)
  mockDb.from.mockReturnValue(mockDb)
  mockDb.where.mockReturnValue(mockDb)
  mockDb.leftJoin.mockReturnValue(mockDb)
  mockDb.limit.mockImplementation(() => Promise.resolve([]))
  // Make mockDb thenable
  mockDb[Symbol.iterator] = [][Symbol.iterator]
  mockDb.then = (onFulfilled: any) => Promise.resolve([]).then(onFulfilled)
})

const handle = handler as any
const fakeEvent = () => ({
  waitUntil: vi.fn(),
} as any)

describe('POST /api/sendBookingConfirmation', () => {
  it('throws 404 if student is not found', async () => {
    vi.stubGlobal('requireAuth', vi.fn().mockResolvedValue({
        $id: 'user-123',
        email: 'user@test.com',
        name: 'Test User',
        labels: []
    }))
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({
        email: 'user@test.com',
        lessonId: 'lesson-123'
    }))

    mockDb.limit.mockResolvedValue([]) // No student

    await expect(handle(fakeEvent())).rejects.toMatchObject({
        statusCode: 404,
        statusMessage: 'Student niet gevonden'
    })
  })

  it('throws 404 if booking is not found', async () => {
    vi.stubGlobal('requireAuth', vi.fn().mockResolvedValue({
        $id: 'user-123',
        email: 'user@test.com',
        name: 'Test User',
        labels: []
    }))
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({
        email: 'user@test.com',
        lessonId: 'lesson-123'
    }))

    // First call for student
    mockDb.limit.mockResolvedValueOnce([{ id: 'student-123', name: 'Real Name', email: 'user@test.com' }])
    // Second call for booking
    mockDb.limit.mockResolvedValueOnce([])

    await expect(handle(fakeEvent())).rejects.toMatchObject({
        statusCode: 404,
        statusMessage: 'Boeking niet gevonden voor deze student'
    })
  })

  it('sends emails and push when booking is verified', async () => {
    vi.stubGlobal('requireAuth', vi.fn().mockResolvedValue({
        $id: 'user-123',
        email: 'user@test.com',
        name: 'Test User',
        labels: []
    }))
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({
        email: 'user@test.com',
        lessonId: 'lesson-123'
    }))

    // Student find
    mockDb.limit.mockResolvedValueOnce([{ id: 'student-123', name: 'Real Name', email: 'user@test.com' }])
    // Booking find
    mockDb.limit.mockResolvedValueOnce([{ id: 'booking-123' }])
    // Lesson find
    mockDb.limit.mockResolvedValueOnce([{ id: 'lesson-123', date: new Date(), type: 'hatha yoga', maxSpots: 10 }])

    // Booking list (for capacity) - this one uses await mockDb.select()...where() directly
    mockDb.then = (onFulfilled: any) => Promise.resolve([{ id: 'booking-123', studentName: 'Real Name' }]).then(onFulfilled)

    // Credit check
    mockDb.limit.mockResolvedValueOnce([{ id: 'credit-123' }])

    let waitUntilPromise: Promise<void> | null = null
    const event = {
        waitUntil: vi.fn((p) => { waitUntilPromise = p })
    } as any

    const result = await handle(event)

    if (waitUntilPromise) {
        await waitUntilPromise
    }

    expect(mockSmtp.sendMail).toHaveBeenCalled()
  })
})
