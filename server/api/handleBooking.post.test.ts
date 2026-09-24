import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createQueuedDb, asUser } from '../test-utils'
import handler from './handleBooking.post'

const future = new Date(Date.now() + 7 * 864e5)
const past = new Date(Date.now() - 864e5)
const handle = handler as any
let db: ReturnType<typeof createQueuedDb>
let event: any

/** Row shape of the joined lessons ⟕ bookings query; one row per booking (or one with bookingId null). */
const lessonRow = (overrides: Record<string, any> = {}) => ({
    id: 'l1', date: future, maxSpots: 9, type: 'hatha yoga', teacher: 'Ravennah',
    bookingId: null, bookingStudentId: null, bookingSource: null, ...overrides,
})
const fullLesson = (date = future) => Array.from({ length: 9 }, (_, i) =>
    lessonRow({ date, bookingId: `b${i}`, bookingStudentId: `s${i}`, bookingSource: 'regular' }))

function givenLesson(rows: any[]) {
    db = createQueuedDb([rows])
    vi.stubGlobal('db', db)
}

beforeEach(() => {
    vi.restoreAllMocks()
    event = { waitUntil: vi.fn() }
    givenLesson([lessonRow()])
    vi.stubGlobal('readBody', vi.fn())
    vi.stubGlobal('findAvailableCredit', vi.fn().mockResolvedValue({ id: 'c1' }))
    vi.stubGlobal('generateId', vi.fn().mockReturnValue('new-booking-id'))
    vi.stubGlobal('sendBookingNotifications', vi.fn().mockResolvedValue(undefined))
})

describe('POST /api/handleBooking', () => {
    it('throws 400 when lessonId is missing', async () => {
        asUser('u1')
        vi.mocked(readBody).mockResolvedValue({})
        await expect(handle(event)).rejects.toMatchObject({ statusCode: 400 })
    })

    it('successfully books a regular lesson', async () => {
        asUser('u1')
        vi.mocked(readBody).mockResolvedValue({ lessonId: 'l1' })

        const result = await handle(event)

        expect(result.success).toBe(true)
        expect(result.spots).toBe(8) // 9 - 1
        expect(db.inserter.values).toHaveBeenCalledWith(expect.objectContaining({ studentId: 'u1', source: 'regular' }))
        expect(db.update).toHaveBeenCalled() // Credit used
    })

    it('throws 409 when lesson is full for regular booking', async () => {
        givenLesson(fullLesson())
        asUser('u2')
        vi.mocked(readBody).mockResolvedValue({ lessonId: 'l1' })

        await expect(handle(event)).rejects.toMatchObject({ statusCode: 409, statusMessage: 'Les is vol' })
    })

    it('allows classpass booking even if lesson is full', async () => {
        givenLesson(fullLesson())
        asUser('admin1', { admin: true })
        vi.mocked(readBody).mockResolvedValue({ lessonId: 'l1', source: 'classpass', onBehalfOfUserId: 'u2' })

        const result = await handle(event)

        expect(result.success).toBe(true)
        expect(result.source).toBe('classpass')
        expect(result.spots).toBe(0) // spots left for regular bookings remains 0
        expect(db.update).not.toHaveBeenCalled() // No credit used for classpass
    })

    it('throws 409 if already booked', async () => {
        givenLesson([lessonRow({ bookingId: 'b1', bookingStudentId: 'u1', bookingSource: 'regular' })])
        asUser('u1')
        vi.mocked(readBody).mockResolvedValue({ lessonId: 'l1' })

        await expect(handle(event)).rejects.toMatchObject({ statusCode: 409, statusMessage: 'Gebruiker is al geboekt voor deze les' })
    })

    it('allows duplicate booking if extraSpot is true', async () => {
        givenLesson([lessonRow({ bookingId: 'b1', bookingStudentId: 'u1', bookingSource: 'regular' })])
        asUser('u1')
        vi.mocked(readBody).mockResolvedValue({ lessonId: 'l1', extraSpot: true })

        const result = await handle(event)

        expect(result.success).toBe(true)
        expect(result.spots).toBe(7) // 9 - (1 existing + 1 new)
    })

    it('throws 400 for past lesson', async () => {
        givenLesson([lessonRow({ date: past })])
        asUser('u1')
        vi.mocked(readBody).mockResolvedValue({ lessonId: 'l1' })

        await expect(handle(event)).rejects.toMatchObject({ statusCode: 400, statusMessage: 'Kan niet boeken voor een les in het verleden' })
    })

    it('allows admin to book past lesson for student', async () => {
        givenLesson([lessonRow({ date: past })])
        asUser('admin1', { admin: true })
        vi.mocked(readBody).mockResolvedValue({ lessonId: 'l1', onBehalfOfUserId: 'u2' })

        const result = await handle(event)

        expect(result.success).toBe(true)
        expect(db.inserter.values).toHaveBeenCalledWith(expect.objectContaining({ studentId: 'u2' }))
    })

    it('does not let an admin book themselves into a past lesson', async () => {
        givenLesson([lessonRow({ date: past })])
        asUser('admin1', { admin: true })
        vi.mocked(readBody).mockResolvedValue({ lessonId: 'l1', onBehalfOfUserId: 'admin1' })

        await expect(handle(event)).rejects.toMatchObject({ statusCode: 400, statusMessage: 'Kan niet boeken voor een les in het verleden' })
    })
})

describe('POST /api/handleBooking notifications', () => {
    it('notifies for the booked student, not a client-supplied name', async () => {
        asUser('student-a')
        vi.mocked(readBody).mockResolvedValue({ lessonId: 'l1', onBehalfOfUserId: null, name: 'Iemand anders' })

        await handle(event)

        expect(sendBookingNotifications).toHaveBeenCalledWith('confirmation', { lessonId: 'l1', studentId: 'student-a' })
        expect(event.waitUntil).toHaveBeenCalledOnce()
    })

    it('notifies for the target student when an admin books on behalf', async () => {
        asUser('admin-1', { admin: true })
        vi.mocked(readBody).mockResolvedValue({ lessonId: 'l1', onBehalfOfUserId: 'student-b' })

        await handle(event)

        expect(sendBookingNotifications).toHaveBeenCalledWith('confirmation', { lessonId: 'l1', studentId: 'student-b' })
    })

    it('skips notifications for classpass bookings', async () => {
        asUser('admin-1', { admin: true })
        vi.mocked(readBody).mockResolvedValue({ lessonId: 'l1', onBehalfOfUserId: 'student-b', source: 'classpass' })

        await handle(event)

        expect(sendBookingNotifications).not.toHaveBeenCalled()
    })

    it('skips notifications when an admin adds a student to a past lesson', async () => {
        givenLesson([lessonRow({ date: past })])
        asUser('admin-1', { admin: true })
        vi.mocked(readBody).mockResolvedValue({ lessonId: 'l1', onBehalfOfUserId: 'student-b' })

        await handle(event)

        expect(sendBookingNotifications).not.toHaveBeenCalled()
    })

    it('still succeeds when notifications fail', async () => {
        asUser('student-a')
        vi.mocked(readBody).mockResolvedValue({ lessonId: 'l1' })
        vi.mocked(sendBookingNotifications).mockRejectedValue(new Error('smtp down'))

        await expect(handle(event)).resolves.toMatchObject({ success: true })
        await expect(event.waitUntil.mock.calls[0][0]).resolves.toBeUndefined()
    })
})
