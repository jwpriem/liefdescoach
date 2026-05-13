import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { lessons } from '../database/schema'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const body = await readBody(event)

    if (!body?.lessonId || typeof body.lessonId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'lessonId is verplicht' })
    }

    if (
        body.maxSpots === undefined ||
        !Number.isInteger(body.maxSpots) ||
        body.maxSpots < 1 ||
        body.maxSpots > 50
    ) {
        throw createError({ statusCode: 400, statusMessage: 'maxSpots moet een geheel getal tussen 1 en 50 zijn' })
    }

    const result = await db
        .update(lessons)
        .set({ maxSpots: body.maxSpots })
        .where(eq(lessons.id, body.lessonId))
        .returning()

    if (result.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'Les niet gevonden' })
    }

    const row = result[0]
    return {
        $id: row.id,
        date: row.date?.toISOString(),
        type: row.type,
        teacher: row.teacher,
        maxSpots: row.maxSpots,
    }
})
