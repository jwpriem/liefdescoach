import { eq } from 'drizzle-orm'
import { bookings, lessons, students } from '../database/schema'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { targetId: targetUserId } = await requireSelfOrAdmin(event, body?.userId)

    const rows = await db
        .select({
            id: bookings.id,
            bookingId: bookings.id,
            lessonId: lessons.id,
            lessonDate: lessons.date,
            lessonType: lessons.type,
            lessonTeacher: lessons.teacher,
            studentId: bookings.studentId,
            studentName: students.name,
            studentEmail: students.email,
        })
        .from(bookings)
        .innerJoin(lessons, eq(bookings.lessonId, lessons.id))
        .leftJoin(students, eq(bookings.studentId, students.id))
        .where(eq(bookings.studentId, targetUserId))
        .limit(100)

    return nestBookingsWithLessons(rows)
})
