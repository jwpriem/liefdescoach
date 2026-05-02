import { createError } from 'h3'
import { and, eq, isNull, gt } from 'drizzle-orm'
import { credits } from '../../database/schema'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const body = await readBody(event)

    if (!body?.studentId || typeof body.studentId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'studentId is verplicht' })
    }

    const now = new Date()

    const [credit] = await db
        .select({ id: credits.id })
        .from(credits)
        .where(
            and(
                eq(credits.studentId, body.studentId),
                isNull(credits.bookingId),
                gt(credits.validTo, now),
            )
        )
        .orderBy(credits.validTo)
        .limit(1)

    if (!credit) {
        throw createError({ statusCode: 404, statusMessage: 'Geen beschikbare credit gevonden om te verwijderen' })
    }

    await db.delete(credits).where(eq(credits.id, credit.id))

    return { success: true, deletedId: credit.id }
})
