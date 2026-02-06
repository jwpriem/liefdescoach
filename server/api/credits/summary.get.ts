/**
 * Admin-only endpoint: returns credit summary (available count) for all students.
 * Returns a map of studentId -> available credit count.
 */
export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const { tablesDB, Query } = useServerAppwrite()
    const config = useRuntimeConfig()

    // Fetch all credits that are not used and not expired
    const now = new Date().toISOString()
    const allCredits: any[] = []
    let offset = 0
    const limit = 100

    try {
        while (true) {
            const res = await tablesDB.listRows(
                config.public.database,
                'credits',
                [
                    Query.isNull('bookingId'),
                    Query.greaterThan('validTo', now),
                    Query.limit(limit),
                    Query.offset(offset),
                ]
            )
            const rows = res.rows ?? []
            allCredits.push(...rows)
            if (rows.length < limit) break
            offset += limit
        }
    } catch {
        // credits collection may not exist yet
        return { summary: {} }
    }

    // Group by studentId
    const summary: Record<string, number> = {}
    for (const credit of allCredits) {
        summary[credit.studentId] = (summary[credit.studentId] || 0) + 1
    }

    return { summary }
})
