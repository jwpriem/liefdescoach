import { createError } from 'h3'

/**
 * Admin-only endpoint to add credits for a student.
 *
 * Body:
 *   - studentId: string (required)
 *   - type: 'credit_1' | 'credit_5' | 'credit_10' (required)
 *
 * Creates 1, 5, or 10 credit rows depending on type.
 * Validity: credit_1 = 3 months, credit_5 = 3 months, credit_10 = 6 months.
 */
export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const { tablesDB, ID } = useServerAppwrite()
    const config = useRuntimeConfig()

    const body = await readBody(event)

    if (!body?.studentId || typeof body.studentId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'studentId is verplicht' })
    }

    const validTypes = ['credit_1', 'credit_5', 'credit_10']
    if (!body?.type || !validTypes.includes(body.type)) {
        throw createError({ statusCode: 400, statusMessage: 'type moet credit_1, credit_5, of credit_10 zijn' })
    }

    const creditCounts: Record<string, number> = {
        credit_1: 1,
        credit_5: 5,
        credit_10: 10,
    }

    // Validity periods: 1 and 5 = 3 months, 10 = 6 months
    const validityMonths: Record<string, number> = {
        credit_1: 3,
        credit_5: 3,
        credit_10: 6,
    }

    const count = creditCounts[body.type]
    const months = validityMonths[body.type]

    const now = new Date()
    const validFrom = now.toISOString()
    const validTo = new Date(now.getFullYear(), now.getMonth() + months, now.getDate()).toISOString()

    const created = []
    for (let i = 0; i < count; i++) {
        const doc = await tablesDB.createRow(
            config.public.database,
            'credits',
            ID.unique(),
            {
                studentId: body.studentId,
                bookingId: null,
                type: body.type,
                validFrom,
                validTo,
                createdAt: now.toISOString(),
                usedAt: null,
            }
        )
        created.push(doc)
    }

    return {
        success: true,
        count,
        type: body.type,
        validFrom,
        validTo,
    }
})
