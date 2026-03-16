import { lte, gte, desc, eq, and } from 'drizzle-orm'
import { lessons, bookings, students, health } from '../database/schema'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const db = useDB()
    const query = getQuery(event)

    const toDate = query.to ? new Date(query.to as string) : new Date()
    const fromDate = query.from
        ? new Date(query.from as string)
        : new Date(new Date().setMonth(new Date().getMonth() - 3))

    const lessonRows = await db
        .select()
        .from(lessons)
        .where(and(gte(lessons.date, fromDate), lte(lessons.date, toDate)))
        .orderBy(desc(lessons.date))

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
