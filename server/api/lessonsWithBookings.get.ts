import { gte, lt, asc, desc, eq } from 'drizzle-orm'
import { lessons, bookings, students, health } from '../database/schema'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const db = useDB()
    const now = new Date()

    const futureLessonRows = await db
        .select()
        .from(lessons)
        .where(gte(lessons.date, now))
        .orderBy(asc(lessons.date))
        .limit(100)

    const [latestPastLesson] = await db
        .select()
        .from(lessons)
        .where(lt(lessons.date, now))
        .orderBy(desc(lessons.date))
        .limit(1)

    const lessonRows = latestPastLesson
        ? [latestPastLesson, ...futureLessonRows]
        : futureLessonRows

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
                studentInjury: health.injury,
                studentPregnancy: health.pregnancy,
            })
            .from(bookings)
            .leftJoin(students, eq(bookings.studentId, students.id))
            .leftJoin(health, eq(health.studentId, students.id))
            .where(inArray(bookings.lessonId, lessonIds))
    }

    return nestLessonsWithBookings(lessonRows, bookingRows, true)
})
