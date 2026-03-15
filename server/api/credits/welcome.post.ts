import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { credits } from '../../database/schema'

/**
 * Grants a single welcome credit to a newly registered user.
 * Only works if the user currently has zero credits (prevents abuse).
 */
export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)
    const db = useDB()

    const body = await readBody(event)
    const studentId = body?.studentId

    if (!studentId || typeof studentId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'studentId is verplicht' })
    }

    if (studentId !== user.$id) {
        throw createError({ statusCode: 403, statusMessage: 'Geen toegang' })
    }

    const existing = await db
        .select({ id: credits.id })
        .from(credits)
        .where(eq(credits.studentId, studentId))
        .limit(1)

    if (existing.length > 0) {
        return { success: false, reason: 'Gebruiker heeft al credits' }
    }

    const now = new Date()
    const validFrom = now
    const validTo = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate())

    await db.insert(credits).values({
        id: generateId(),
        studentId,
        bookingId: null,
        type: 'credit_1',
        validFrom,
        validTo,
        createdAt: now,
        usedAt: null,
    })

    return { success: true, count: 1, validFrom: validFrom.toISOString(), validTo: validTo.toISOString() }
})
