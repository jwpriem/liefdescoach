import { eq } from 'drizzle-orm'
import { students, health } from '../../database/schema'

/**
 * ⚡ Bolt: Admin-only endpoint to fetch a single user's profile and health data directly.
 * This prevents fetching all users from the database and transmitting a heavy payload
 * when loading a single user's detail page.
 */
export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const userId = getRouterParam(event, 'id')
    if (!userId) {
        throw createError({ statusCode: 400, statusMessage: 'User ID is required' })
    }

    // Fetch the target student with optional health data
    const rows = await db
        .select({
            id: students.id,
            name: students.name,
            email: students.email,
            phone: students.phone,
            dateOfBirth: students.dateOfBirth,
            isAdmin: students.isAdmin,
            emailVerified: students.emailVerified,
            createdAt: students.createdAt,
            archived: students.archived,
            reminders: students.reminders,
            phoneRequested: students.phoneRequested,
            healthId: health.id,
            injury: health.injury,
            pregnancy: health.pregnancy,
            dueDate: health.dueDate,
        })
        .from(students)
        .leftJoin(health, eq(students.id, health.studentId))
        .where(eq(students.id, userId))
        .limit(1)

    if (rows.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    const r = rows[0]
    const user = {
        $id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        dateOfBirth: r.dateOfBirth?.toISOString() ?? null,
        labels: r.isAdmin ? ['admin'] : [],
        emailVerification: r.emailVerified,
        registration: r.createdAt?.toISOString() ?? null,
        archived: r.archived,
        reminders: r.reminders,
        phoneRequested: r.phoneRequested,
        health: r.healthId ? {
            $id: r.healthId,
            injury: r.injury,
            pregnancy: r.pregnancy,
            dueDate: r.dueDate?.toISOString() ?? null,
        } : null,
    }

    return { user }
})
