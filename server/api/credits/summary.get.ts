import { isNull, gt, sql } from 'drizzle-orm'
import { and } from 'drizzle-orm'
import { credits } from '../../database/schema'

/**
 * Admin-only endpoint: returns credit summary (available count) for all students.
 * Returns a map of studentId -> available credit count.
 */
export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const db = useDB()
    const now = new Date()

    const rows = await db
        .select({
            studentId: credits.studentId,
            count: sql<number>`count(*)::int`,
        })
        .from(credits)
        .where(
            and(
                isNull(credits.bookingId),
                gt(credits.validTo, now)
            )
        )
        .groupBy(credits.studentId)

    const summary: Record<string, number> = {}
    for (const row of rows) {
        summary[row.studentId] = row.count
    }

    return { summary }
})
