import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createQueuedDb, asUser } from '../test-utils'
import { requireAdmin } from '../utils/auth'
import handler from './deleteLesson.post'

const handle = handler as any
let event: any

beforeEach(() => {
    vi.restoreAllMocks()
    event = {}
    vi.stubGlobal('requireAdmin', requireAdmin)
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({ lessonId: 'lesson-1' }))
})

describe('POST /api/deleteLesson', () => {
    it('throws 403 when user is not an admin', async () => {
        asUser('student-1', { admin: false })
        await expect(handle(event)).rejects.toThrow('Geen toegang')
    })

    it('throws 400 when lessonId is missing', async () => {
        asUser('admin-1', { admin: true })
        vi.stubGlobal('readBody', vi.fn().mockResolvedValue({}))

        await expect(handle(event)).rejects.toThrow('lessonId is verplicht')
    })

    it('throws 400 when lessonId is not a string', async () => {
        asUser('admin-1', { admin: true })
        vi.stubGlobal('readBody', vi.fn().mockResolvedValue({ lessonId: 12345 }))

        await expect(handle(event)).rejects.toThrow('lessonId is verplicht')
    })

    it('deletes lesson and releases credits for existing bookings', async () => {
        const fakeDb = createQueuedDb([[{ id: 'booking-1' }]])
        vi.stubGlobal('db', fakeDb)
        asUser('admin-1', { admin: true })

        const res = await handle(event)

        expect(res).toEqual({ success: true })
        expect(fakeDb.delete).toHaveBeenCalled()
        expect(fakeDb.update).toHaveBeenCalled()
    })

    it('deletes lesson when no bookings exist', async () => {
        const fakeDb = createQueuedDb([[]])
        vi.stubGlobal('db', fakeDb)
        asUser('admin-1', { admin: true })

        const res = await handle(event)

        expect(res).toEqual({ success: true })
        expect(fakeDb.delete).toHaveBeenCalled()
        expect(fakeDb.update).not.toHaveBeenCalled()
    })
})
