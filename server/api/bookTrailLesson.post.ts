import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { bookings, students } from '../database/schema'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

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

    const email = body.email.trim().toLowerCase()

    // Fetch lesson to get its capacity
    const lesson = await getLessonWithBookings(body.lessonId)
    if (!lesson) {
        throw createError({ statusCode: 404, statusMessage: 'Les niet gevonden' })
    }

    // Check capacity
    const bookingCount = await countLessonBookings(body.lessonId)
    if (bookingCount >= lesson.maxSpots) {
        throw createError({ statusCode: 409, statusMessage: 'Les is vol' })
    }

    // Check if student with this email already exists to prevent duplicate email DB constraint errors
    let studentId: string
    const existing = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.email, email))
        .limit(1)

    if (existing.length > 0) {
        studentId = existing[0].id
    } else {
        studentId = generateId()
        await db.insert(students).values({
            id: studentId,
            name: body.name.trim() + ' (Proefles)',
            email,
        })
    }

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
