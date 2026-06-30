import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock h3
vi.mock('h3', () => ({
  createError: (opts: any) => {
    const err = new Error(opts.statusMessage) as any
    err.statusCode = opts.statusCode
    err.statusMessage = opts.statusMessage
    return err
  },
  readBody: vi.fn(),
  setResponseStatus: vi.fn(),
  getHeader: vi.fn().mockReturnValue('https://ravennah.com'),
  getRequestIP: vi.fn().mockReturnValue('127.0.0.1'),
}))

vi.stubGlobal('setResponseStatus', vi.fn())

import confirmationHandler from './sendBookingConfirmation.post'
import cancellationHandler from './sendBookingCancellation.post'

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  execute: vi.fn(),
  // Drizzle select returns a promise that resolves to rows
  then: (onfulfilled: any) => Promise.resolve([]).then(onfulfilled),
}

// Chainable mock helper
const mockSelect = (rows: any[]) => {
  const m = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    then: (onfulfilled: any) => Promise.resolve(rows).then(onfulfilled),
  }
  return m as any
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('db', mockDb)
  vi.stubGlobal('requireAuth', vi.fn())
  vi.stubGlobal('smtpTransport', { sendMail: vi.fn().mockResolvedValue({}) })
  vi.stubGlobal('sendPushToAdmins', vi.fn().mockResolvedValue({}))
  vi.stubGlobal('bookingStudentEmail', vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }))
  vi.stubGlobal('bookingAdminEmail', vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }))
  vi.stubGlobal('cancellationStudentEmail', vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }))
  vi.stubGlobal('cancellationAdminEmail', vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }))
  vi.stubGlobal('formatLessonDate', vi.fn().mockReturnValue('Formatted Date'))
  vi.stubGlobal('formatISODate', vi.fn().mockReturnValue('2023-01-01'))
  vi.stubGlobal('formatHour', vi.fn().mockReturnValue('10'))
  vi.stubGlobal('formatMinutes', vi.fn().mockReturnValue('00'))
})

describe('Booking Notification Vulnerability', () => {
  it('sendBookingConfirmation: prevents sending email for another user', async () => {
    // Current user is "attacker"
    vi.mocked(requireAuth).mockResolvedValue({ $id: 'attacker', email: 'attacker@test.com', name: 'Attacker', labels: [] } as any)

    // Attacker requests confirmation for "victim"
    vi.mocked(readBody).mockResolvedValue({
      email: 'victim@test.com',
      lessonId: 'lesson-1',
      name: 'Victim'
    })

    await expect((confirmationHandler as any)({})).rejects.toMatchObject({ statusCode: 403, statusMessage: 'Geen toegang' })
  })

  it('sendBookingConfirmation: attacker can spam emails to themselves for lessons they did not book', async () => {
     vi.mocked(requireAuth).mockResolvedValue({ $id: 'attacker', email: 'attacker@test.com', name: 'Attacker', labels: [] } as any)

    vi.mocked(readBody).mockResolvedValue({
      email: 'attacker@test.com',
      lessonId: 'lesson-1',
      name: 'Attacker'
    })

    // Mock DB responses
    // 1. Student lookup
    mockDb.select.mockReturnValueOnce(mockSelect([{ id: 'attacker', name: 'Attacker', email: 'attacker@test.com' }]))
    // 2. Booking check (none found)
    mockDb.select.mockReturnValueOnce(mockSelect([]))

    // Should now throw 403
    await expect((confirmationHandler as any)({})).rejects.toMatchObject({ statusCode: 403, statusMessage: 'Geen boeking gevonden voor deze les' })

    expect(smtpTransport.sendMail).not.toHaveBeenCalled()
  })

  it('sendBookingCancellation: verifies student existence', async () => {
     vi.mocked(requireAuth).mockResolvedValue({ $id: 'attacker', email: 'attacker@test.com', name: 'Attacker', labels: [] } as any)

    vi.mocked(readBody).mockResolvedValue({
      email: 'attacker@test.com',
      lessonId: 'lesson-1',
      name: 'Attacker'
    })

    // Mock DB responses: Student not found
    mockDb.select.mockReturnValueOnce(mockSelect([]))

    await expect((cancellationHandler as any)({})).rejects.toMatchObject({ statusCode: 404, statusMessage: 'Student niet gevonden' })

    expect(smtpTransport.sendMail).not.toHaveBeenCalled()
  })
})
