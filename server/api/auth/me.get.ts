import { eq } from 'drizzle-orm'
import { health } from '../../database/schema'

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's data.
 */
export default defineEventHandler(async (event) => {
    const sessionUser = await getSessionUser(event)

    if (!sessionUser) {
        throw createError({ statusCode: 401, statusMessage: 'Niet ingelogd' })
    }

    // ⚡ Bolt: Consolidate health and profile data into /api/auth/me to reduce network roundtrips.
    const healthRows = await db
        .select()
        .from(health)
        .where(eq(health.studentId, sessionUser.userId))
        .limit(1)

    let healthData = null
    if (healthRows.length > 0) {
        const h = healthRows[0]
        healthData = {
            $id: h.id,
            injury: h.injury,
            pregnancy: h.pregnancy,
            dueDate: h.dueDate?.toISOString() ?? null,
        }
    }

    return {
        $id: sessionUser.userId,
        email: sessionUser.email,
        name: sessionUser.name,
        labels: sessionUser.isAdmin ? ['admin'] : [],
        emailVerification: sessionUser.emailVerified,
        archived: sessionUser.archived,
        reminders: sessionUser.reminders,
        pushNotifications: sessionUser.pushNotifications,
        dateOfBirth: (sessionUser as any).dateOfBirth?.toISOString() ?? null,
        phone: (sessionUser as any).phone,
        phoneRequested: (sessionUser as any).phoneRequested,
        registration: (sessionUser as any).registration?.toISOString() ?? null,
        health: healthData,
    }
})
