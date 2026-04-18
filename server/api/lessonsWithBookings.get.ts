import { gte, lt, asc, desc, eq, inArray } from 'drizzle-orm'
import { lessons, bookings, students, health } from '../database/schema'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
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
        bookingRows = await db
            .select({
                id: bookings.id,
                lessonId: bookings.lessonId,
                studentId: bookings.studentId,
                source: bookings.source,
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

    const studentIds = [...new Set(bookingRows.map((b: any) => b.studentId))]
    const firstLessonDates = await getFirstLessonDatesForStudents(studentIds)
    const lessonDateMap = new Map(lessonRows.map(l => [l.id, l.date]))

    const enrichedBookingRows = bookingRows.map((b: any) => {
        const firstDate = firstLessonDates.get(b.studentId)
        const lessonDate = lessonDateMap.get(b.lessonId)
        return {
            ...b,
            isFirstTime: firstDate != null && lessonDate != null && firstDate.getTime() === lessonDate.getTime(),
        }
    })

    return nestLessonsWithBookings(lessonRows, enrichedBookingRows, true)
})
