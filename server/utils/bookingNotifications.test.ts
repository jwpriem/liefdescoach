import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createQueuedDb } from '../test-utils'
import { sendBookingNotifications } from './bookingNotifications'

const lesson = { id: 'lesson-1', date: new Date('2026-10-04T07:45:00Z'), type: 'hatha', teacher: 'Ravennah', maxSpots: 9 }
const student = { name: 'Bea uit DB', email: 'bea@test.nl' }
const mail = { subject: 's', html: 'h', text: 't' }

beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal('smtpTransport', { sendMail: vi.fn().mockResolvedValue({ accepted: [] }) })
    vi.stubGlobal('sendPushToAdmins', vi.fn().mockResolvedValue(1))
    vi.stubGlobal('findAvailableCredit', vi.fn().mockResolvedValue({ id: 'credit-1' }))
    for (const fn of ['bookingStudentEmail', 'bookingAdminEmail', 'cancellationStudentEmail', 'cancellationAdminEmail']) {
        vi.stubGlobal(fn, vi.fn().mockReturnValue(mail))
    }
    for (const fn of ['formatLessonDate', 'formatISODate', 'formatHour', 'formatMinutes']) {
        vi.stubGlobal(fn, vi.fn().mockReturnValue('x'))
    }
})

describe('sendBookingNotifications', () => {
    it('uses the name and email from the database for a confirmation', async () => {
        vi.stubGlobal('db', createQueuedDb([[lesson], [student], [{ studentName: 'Bea uit DB' }]]))

        await sendBookingNotifications('confirmation', { lessonId: 'lesson-1', studentId: 'student-b' })

        expect(bookingStudentEmail).toHaveBeenCalledWith(expect.objectContaining({ name: 'Bea uit DB' }))
        expect(bookingAdminEmail).toHaveBeenCalledWith(expect.objectContaining({ name: 'Bea uit DB', email: 'bea@test.nl', spots: 8 }))
        expect(smtpTransport.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'bea@test.nl' }))
        expect(smtpTransport.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'info@ravennah.com' }))
        expect(sendPushToAdmins).toHaveBeenCalledWith(expect.objectContaining({ title: 'Nieuwe boeking' }))
    })

    it('alerts the admin when the student has no credits left after booking', async () => {
        vi.stubGlobal('db', createQueuedDb([[lesson], [student], []]))
        vi.mocked(findAvailableCredit).mockResolvedValue(null)

        await sendBookingNotifications('confirmation', { lessonId: 'lesson-1', studentId: 'student-b' })

        expect(sendPushToAdmins).toHaveBeenCalledWith(expect.objectContaining({ title: 'Credits op' }))
    })

    it('sends cancellation templates without a credit check', async () => {
        vi.stubGlobal('db', createQueuedDb([[lesson], [student], []]))

        await sendBookingNotifications('cancellation', { lessonId: 'lesson-1', studentId: 'student-b' })

        expect(cancellationStudentEmail).toHaveBeenCalledWith(expect.objectContaining({ name: 'Bea uit DB' }))
        expect(bookingStudentEmail).not.toHaveBeenCalled()
        expect(findAvailableCredit).not.toHaveBeenCalled()
        expect(sendPushToAdmins).toHaveBeenCalledWith(expect.objectContaining({ title: 'Annulering' }))
    })

    it('sends nothing when the student has no email address', async () => {
        vi.stubGlobal('db', createQueuedDb([[lesson], [{ name: 'Classpass gast', email: null }]]))

        await sendBookingNotifications('confirmation', { lessonId: 'lesson-1', studentId: 'student-c' })

        expect(smtpTransport.sendMail).not.toHaveBeenCalled()
        expect(sendPushToAdmins).not.toHaveBeenCalled()
    })

    it('keeps going when one email fails', async () => {
        vi.stubGlobal('db', createQueuedDb([[lesson], [student], []]))
        vi.mocked(smtpTransport.sendMail).mockRejectedValueOnce(new Error('smtp down'))

        await expect(sendBookingNotifications('confirmation', { lessonId: 'lesson-1', studentId: 'student-b' })).resolves.toBeUndefined()
        expect(smtpTransport.sendMail).toHaveBeenCalledTimes(2)
        expect(sendPushToAdmins).toHaveBeenCalled()
    })
})
