import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createQueuedDb, asUser } from '../test-utils'
import handler from './handleBooking.post'

const future = { id: 'lesson-1', date: new Date(Date.now() + 7 * 864e5), type: 'hatha', teacher: 'R', maxSpots: 9 }
const past = { ...future, date: new Date(Date.now() - 864e5) }
const handle = handler as any
let event: any

function setup(lesson: any) {
    vi.stubGlobal('db', createQueuedDb([[lesson], []]))
}

beforeEach(() => {
    vi.restoreAllMocks()
    event = { waitUntil: vi.fn() }
    vi.stubGlobal('readBody', vi.fn())
    vi.stubGlobal('findAvailableCredit', vi.fn().mockResolvedValue({ id: 'credit-1' }))
    vi.stubGlobal('countRegularLessonBookings', vi.fn().mockResolvedValue(1))
    vi.stubGlobal('sendBookingNotifications', vi.fn().mockResolvedValue(undefined))
})

describe('POST /api/handleBooking notifications', () => {
    it('notifies for the booked student, not a client-supplied name', async () => {
        setup(future)
        asUser('student-a')
        vi.mocked(readBody).mockResolvedValue({ lessonId: 'lesson-1', onBehalfOfUserId: null, name: 'Iemand anders' })

        await handle(event)

        expect(sendBookingNotifications).toHaveBeenCalledWith('confirmation', { lessonId: 'lesson-1', studentId: 'student-a' })
        expect(event.waitUntil).toHaveBeenCalledOnce()
    })

    it('notifies for the target student when an admin books on behalf', async () => {
        setup(future)
        asUser('admin-1', { admin: true })
        vi.mocked(readBody).mockResolvedValue({ lessonId: 'lesson-1', onBehalfOfUserId: 'student-b' })

        await handle(event)

        expect(sendBookingNotifications).toHaveBeenCalledWith('confirmation', { lessonId: 'lesson-1', studentId: 'student-b' })
    })

    it('skips notifications for classpass bookings', async () => {
        setup(future)
        asUser('admin-1', { admin: true })
        vi.mocked(readBody).mockResolvedValue({ lessonId: 'lesson-1', onBehalfOfUserId: 'student-b', source: 'classpass' })

        await handle(event)

        expect(sendBookingNotifications).not.toHaveBeenCalled()
    })

    it('skips notifications when an admin adds a student to a past lesson', async () => {
        setup(past)
        asUser('admin-1', { admin: true })
        vi.mocked(readBody).mockResolvedValue({ lessonId: 'lesson-1', onBehalfOfUserId: 'student-b' })

        await handle(event)

        expect(sendBookingNotifications).not.toHaveBeenCalled()
    })

    it('still succeeds when notifications fail', async () => {
        setup(future)
        asUser('student-a')
        vi.mocked(readBody).mockResolvedValue({ lessonId: 'lesson-1' })
        vi.mocked(sendBookingNotifications).mockRejectedValue(new Error('smtp down'))

        await expect(handle(event)).resolves.toMatchObject({ success: true })
        await expect(event.waitUntil.mock.calls[0][0]).resolves.toBeUndefined()
    })
})
