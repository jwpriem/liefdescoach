import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createQueuedDb, asUser } from '../test-utils'
import { requireAuth } from '../utils/auth'
import bookingsHandler from './bookings.post'
import creditHistoryHandler from './credits/history.post'
import healthUpdateHandler from './health/update.post'
import updatePrefsHandler from './updatePrefs.post'
import updateProfileHandler from './students/update-profile.post'
import handleBookingHandler from './handleBooking.post'
import cancelBookingHandler from './cancelBooking.post'

/**
 * IDOR regression suite: every route that accepts a student id from the client
 * must refuse to let one student act on another, before touching any data.
 */
const routes = [
    { route: 'POST /api/bookings', handler: bookingsHandler, body: (id: string) => ({ userId: id }) },
    { route: 'POST /api/credits/history', handler: creditHistoryHandler, body: (id: string) => ({ studentId: id }) },
    { route: 'POST /api/health/update', handler: healthUpdateHandler, body: (id: string) => ({ userId: id, injury: 'knie' }) },
    { route: 'POST /api/updatePrefs', handler: updatePrefsHandler, body: (id: string) => ({ userId: id, reminders: true }) },
    { route: 'POST /api/students/update-profile', handler: updateProfileHandler, body: (id: string) => ({ userId: id, name: 'Overgenomen' }) },
    { route: 'POST /api/handleBooking', handler: handleBookingHandler, body: (id: string) => ({ lessonId: 'lesson-1', onBehalfOfUserId: id }) },
]

let db: ReturnType<typeof createQueuedDb>
const event = () => ({ waitUntil: vi.fn() } as any)
const touchedData = () => [db.select, db.insert, db.update, db.delete].some((fn) => fn.mock.calls.length > 0)

beforeEach(() => {
    vi.restoreAllMocks()
    db = createQueuedDb()
    vi.stubGlobal('db', db)
    vi.stubGlobal('readBody', vi.fn())
    // Real auth so routes still on requireAuth (cancelBooking) are exercised too
    vi.stubGlobal('requireAuth', requireAuth)
    vi.stubGlobal('findAvailableCredit', vi.fn().mockResolvedValue(null))
})

describe.each(routes)('$route ownership', ({ handler, body }) => {
    const handle = handler as any

    it('rejects a student acting on another student with 403 and touches no data', async () => {
        asUser('student-a')
        vi.mocked(readBody).mockResolvedValue(body('student-b'))

        await expect(handle(event())).rejects.toMatchObject({ statusCode: 403 })
        expect(touchedData()).toBe(false)
    })

    it('lets an admin act on another student', async () => {
        asUser('admin-1', { admin: true })
        vi.mocked(readBody).mockResolvedValue(body('student-b'))

        const error = await handle(event()).then(() => null, (e: any) => e)

        expect(error?.statusCode).not.toBe(403)
        expect(touchedData()).toBe(true)
    })
})

describe('POST /api/cancelBooking ownership', () => {
    it("rejects cancelling another student's booking with 403 and deletes nothing", async () => {
        db = createQueuedDb([[{ id: 'booking-1', lessonId: 'lesson-1', studentId: 'student-b', source: 'regular', lessonDate: new Date(Date.now() + 7 * 864e5) }]])
        vi.stubGlobal('db', db)
        asUser('student-a')
        vi.mocked(readBody).mockResolvedValue({ bookingId: 'booking-1' })

        await expect((cancelBookingHandler as any)(event())).rejects.toMatchObject({ statusCode: 403 })
        expect(db.delete).not.toHaveBeenCalled()
        expect(db.update).not.toHaveBeenCalled()
    })
})
