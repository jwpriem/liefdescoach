import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createQueuedDb, asUser } from '../test-utils'
import { requireAuth } from '../utils/auth'
import handler from './cancelBooking.post'

const booking = (overrides = {}) => ({
    id: 'booking-1', lessonId: 'lesson-1', studentId: 'student-a', source: 'regular',
    lessonDate: new Date(Date.now() + 7 * 864e5), lessonType: 'hatha', ...overrides,
})
const handle = handler as any
let event: any

beforeEach(() => {
    vi.restoreAllMocks()
    event = { waitUntil: vi.fn() }
    vi.stubGlobal('requireAuth', requireAuth)
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({ bookingId: 'booking-1', name: 'Iemand anders' }))
    vi.stubGlobal('sendBookingNotifications', vi.fn().mockResolvedValue(undefined))
})

describe('POST /api/cancelBooking notifications', () => {
    it("notifies for the booking's student after deleting", async () => {
        vi.stubGlobal('db', createQueuedDb([[booking()], []]))
        asUser('student-a')

        await handle(event)

        expect(sendBookingNotifications).toHaveBeenCalledWith('cancellation', { lessonId: 'lesson-1', studentId: 'student-a' })
        expect(event.waitUntil).toHaveBeenCalledOnce()
    })

    it('skips notifications for classpass bookings', async () => {
        vi.stubGlobal('db', createQueuedDb([[booking({ source: 'classpass' })]]))
        asUser('admin-1', { admin: true })

        await handle(event)

        expect(sendBookingNotifications).not.toHaveBeenCalled()
    })
})
