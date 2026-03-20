import { createError } from 'h3'
import { eq, and } from 'drizzle-orm'
import { pushSubscriptions, students } from '../../database/schema'

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)

    const body = await readBody(event)

    if (!body?.endpoint || typeof body.endpoint !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'endpoint is verplicht' })
    }

    // Delete the subscription
    await db.delete(pushSubscriptions)
        .where(
            and(
                eq(pushSubscriptions.endpoint, body.endpoint),
                eq(pushSubscriptions.studentId, user.$id)
            )
        )

    // Check if user has any remaining subscriptions
    const remaining = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.studentId, user.$id))
        .limit(1)

    // If no subscriptions left, disable push notifications
    if (remaining.length === 0) {
        await db.update(students)
            .set({ pushNotifications: false })
            .where(eq(students.id, user.$id))
    }

    return { success: true }
})
