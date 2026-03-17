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

    if (body.teacher && typeof body.teacher !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Ongeldige docent' })
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
