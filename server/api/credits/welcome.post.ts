import { createError } from 'h3'

/**
 * Grants a single welcome credit to a newly registered user.
 * Only works if the user currently has zero credits (prevents abuse).
 *
 * Body: { studentId: string }
 * Requires: authenticated session (the user themselves)
 */
export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)
    const { tablesDB, ID, Query } = useServerAppwrite()
    const config = useRuntimeConfig()

    const body = await readBody(event)
    const studentId = body?.studentId

    if (!studentId || typeof studentId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'studentId is verplicht' })
    }

    // Only allow users to claim their own welcome credit
    if (studentId !== user.$id) {
        throw createError({ statusCode: 403, statusMessage: 'Geen toegang' })
    }

    // Check if user already has any credits (prevent duplicate welcome credits)
    const existing = await tablesDB.listRows(
        config.public.database,
        'credits',
        [Query.equal('studentId', [studentId])]
    )

    if ((existing.rows?.length ?? 0) > 0) {
        return { success: false, reason: 'Gebruiker heeft al credits' }
    }

    const now = new Date()
    const validFrom = now.toISOString()
    const validTo = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate()).toISOString()

    await tablesDB.createRow(
        config.public.database,
        'credits',
        ID.unique(),
        {
            studentId,
            bookingId: null,
            type: 'credit_1',
            validFrom,
            validTo,
            createdAt: now.toISOString(),
            usedAt: null,
        }
    )

    return { success: true, count: 1, validFrom, validTo }
})
