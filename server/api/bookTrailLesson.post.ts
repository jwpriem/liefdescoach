import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { lessons, bookings, students } from '../database/schema'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const db = useDB()

    const body = await readBody(event)

    if (!body?.name || typeof body.name !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Naam is verplicht' })
    }
    if (!body?.email || typeof body.email !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'E-mail is verplicht' })
    }
    if (!body?.lessonId || typeof body.lessonId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'lessonId is verplicht' })
    }

    // Check capacity
    const bookingCount = await countLessonBookings(body.lessonId)
    if (bookingCount >= MAX_LESSON_CAPACITY) {
        throw createError({ statusCode: 409, statusMessage: 'Les is vol' })
    }

    // Create temp student
    const studentId = generateId()
    await db.insert(students).values({
        id: studentId,
        name: body.name + ' (Proefles)',
        email: body.email,
    })

    // Create booking
    const bookingId = generateId()
    await db.insert(bookings).values({
        id: bookingId,
        lessonId: body.lessonId,
        studentId,
    })

    return {
        $id: bookingId,
        lessons: body.lessonId,
        students: studentId,
    }
})
