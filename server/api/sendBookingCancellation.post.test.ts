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

import handler from './sendBookingCancellation.post'

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
  vi.stubGlobal('cancellationStudentEmail', vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }))
  vi.stubGlobal('cancellationAdminEmail', vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }))

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
const fakeEvent = () => ({} as any)

describe('POST /api/sendBookingCancellation', () => {
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

  it('sends emails and push when student is verified', async () => {
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
    // Lesson find
    mockDb.limit.mockResolvedValueOnce([{ id: 'lesson-123', date: new Date(), type: 'hatha yoga', maxSpots: 10 }])

    // Booking list (for cancellation context)
    mockDb.then = (onFulfilled: any) => Promise.resolve([{ id: 'booking-123', studentName: 'Other Student' }]).then(onFulfilled)

    const result = await handle(fakeEvent())

    expect(mockSmtp.sendMail).toHaveBeenCalled()
  })
})
