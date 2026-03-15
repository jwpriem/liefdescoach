import { gte, asc, eq } from 'drizzle-orm'
import { lessons, bookings } from '../database/schema'

export default defineEventHandler(async () => {
    const db = useDB()
    const now = new Date()

    const lessonRows = await db
        .select()
        .from(lessons)
        .where(gte(lessons.date, now))
        .orderBy(asc(lessons.date))
        .limit(100)

    const lessonIds = lessonRows.map(l => l.id)
    let bookingRows: any[] = []
    if (lessonIds.length > 0) {
        const { inArray } = await import('drizzle-orm')
        bookingRows = await db
            .select()
            .from(bookings)
            .where(inArray(bookings.lessonId, lessonIds))
    }

    return nestLessonsWithBookings(lessonRows, bookingRows)
})
