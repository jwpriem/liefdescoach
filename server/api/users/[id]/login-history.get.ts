import { eq, desc } from 'drizzle-orm'
import { loginHistory } from '../../../database/schema'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const studentId = getRouterParam(event, 'id')
    if (!studentId) {
        throw createError({ statusCode: 400, statusMessage: 'Student ID is verplicht' })
    }

    const logins = await db
        .select({
            id: loginHistory.id,
            ipAddress: loginHistory.ipAddress,
            userAgent: loginHistory.userAgent,
            createdAt: loginHistory.createdAt,
        })
        .from(loginHistory)
        .where(eq(loginHistory.studentId, studentId))
        .orderBy(desc(loginHistory.createdAt))
        .limit(20)

    return { logins }
})
