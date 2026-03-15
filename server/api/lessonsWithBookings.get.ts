import { gte, asc, eq } from 'drizzle-orm'
import { lessons, bookings, students } from '../database/schema'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
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
            .select({
                id: bookings.id,
                lessonId: bookings.lessonId,
                studentId: bookings.studentId,
                studentName: students.name,
                studentEmail: students.email,
            })
            .from(bookings)
            .leftJoin(students, eq(bookings.studentId, students.id))
            .where(inArray(bookings.lessonId, lessonIds))
    }

    return nestLessonsWithBookings(lessonRows, bookingRows, true)
})
