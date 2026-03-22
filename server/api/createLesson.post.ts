import { createError } from 'h3'
import { lessons } from '../database/schema'

const VALID_LESSON_TYPES = ['hatha yoga', 'guest lesson', 'peachy bum'] as const

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const body = await readBody(event)

    if (!body?.date || typeof body.date !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Datum is verplicht' })
    }

    if (!body?.type || !VALID_LESSON_TYPES.includes(body.type)) {
        throw createError({ statusCode: 400, statusMessage: 'Ongeldig lestype' })
    }

    const lessonDate = new Date(body.date)
    if (isNaN(lessonDate.getTime())) {
        throw createError({ statusCode: 400, statusMessage: 'Ongeldige datum' })
    }

    if (body.teacher !== undefined && body.teacher !== null) {
        if (typeof body.teacher !== 'string' || body.teacher.trim().length === 0 || body.teacher.trim().length > 100) {
            throw createError({ statusCode: 400, statusMessage: 'Docent moet tussen 1 en 100 tekens zijn' })
        }
    }

    const result = await db.insert(lessons).values({
        id: generateId(),
        date: lessonDate,
        type: body.type as typeof VALID_LESSON_TYPES[number],
        teacher: body.teacher || null,
    }).returning()

    const row = result[0]
    return {
        $id: row.id,
        date: row.date?.toISOString(),
        type: row.type,
        teacher: row.teacher,
        bookings: [],
    }
})
