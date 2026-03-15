import { eq } from 'drizzle-orm'
import { bookings, lessons, students } from '../database/schema'

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)
    const db = useDB()

    const body = await readBody(event)

    const targetUserId = body?.userId && typeof body.userId === 'string' && user.labels.includes('admin')
        ? body.userId
        : user.$id

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
