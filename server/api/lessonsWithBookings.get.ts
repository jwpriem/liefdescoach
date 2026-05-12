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

    // ⚡ Bolt: Use a single loop to collect unique student IDs and avoid multiple array traversals.
    const studentIdSet = new Set<string>()
    for (const b of bookingRows) {
        if (b.studentId) studentIdSet.add(b.studentId)
    }
    const studentIds = [...studentIdSet]
    const firstLessonDates = await getFirstLessonDatesForStudents(studentIds)

    // ⚡ Bolt: Cache lesson timestamps to avoid redundant .getTime() calls in the enrichedBookingRows loop.
    const lessonTimeMap = new Map<string, number>()
    for (const l of lessonRows) {
        if (l.date) lessonTimeMap.set(l.id, l.date.getTime())
    }

    const enrichedBookingRows = bookingRows.map((b: any) => {
        const firstDate = firstLessonDates.get(b.studentId)
        const lessonTime = lessonTimeMap.get(b.lessonId)
        return {
            ...b,
            isFirstTime: firstDate != null && lessonTime != null && firstDate.getTime() === lessonTime,
        }
    })

    return nestLessonsWithBookings(lessonRows, enrichedBookingRows, true)
})
