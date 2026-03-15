import { createError } from 'h3'
import { credits } from '../../database/schema'

/**
 * Admin-only endpoint to add credits for a student.
 *
 * Body:
 *   - studentId: string (required)
 *   - type: 'credit_1' | 'credit_5' | 'credit_10' | 'credit_20' (required)
 *
 * Creates 1, 5, 10, or 20 credit rows depending on type.
 */
export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const db = useDB()

    const body = await readBody(event)

    if (!body?.studentId || typeof body.studentId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'studentId is verplicht' })
    }

    const validTypes = ['credit_1', 'credit_5', 'credit_10', 'credit_20'] as const
    if (!body?.type || !validTypes.includes(body.type)) {
        throw createError({ statusCode: 400, statusMessage: 'type moet credit_1, credit_5, credit_10 of credit_20 zijn' })
    }

    const creditCounts: Record<string, number> = {
        credit_1: 1,
        credit_5: 5,
        credit_10: 10,
        credit_20: 20,
    }

    const validityMonths: Record<string, number> = {
        credit_1: 6,
        credit_5: 6,
        credit_10: 6,
        credit_20: 12,
    }

    const count = creditCounts[body.type]
    const months = validityMonths[body.type]

    const now = new Date()
    const validFrom = now
    const validTo = new Date(now.getFullYear(), now.getMonth() + months, now.getDate())

    const values = Array.from({ length: count }, () => ({
        id: generateId(),
        studentId: body.studentId,
        bookingId: null,
        type: body.type as typeof validTypes[number],
        validFrom,
        validTo,
        createdAt: now,
        usedAt: null,
    }))

    await db.insert(credits).values(values)

    return {
        success: true,
        count,
        type: body.type,
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
    }
})
