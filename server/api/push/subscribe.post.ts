import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { pushSubscriptions, students } from '../../database/schema'

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)

    const body = await readBody(event)

    if (!body?.endpoint || typeof body.endpoint !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'endpoint is verplicht' })
    }
    if (!body?.keys?.p256dh || !body?.keys?.auth) {
        throw createError({ statusCode: 400, statusMessage: 'keys (p256dh, auth) zijn verplicht' })
    }

    // Upsert: if endpoint already exists, update it; otherwise insert
    const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, body.endpoint))
        .limit(1)

    if (existing.length > 0) {
        await db.update(pushSubscriptions)
            .set({
                studentId: user.$id,
                p256dh: body.keys.p256dh,
                auth: body.keys.auth,
            })
            .where(eq(pushSubscriptions.id, existing[0].id))
    } else {
        await db.insert(pushSubscriptions).values({
            id: generateId(),
            studentId: user.$id,
            endpoint: body.endpoint,
            p256dh: body.keys.p256dh,
            auth: body.keys.auth,
        })
    }

    // Enable push notifications on the student
    await db.update(students)
        .set({ pushNotifications: true })
        .where(eq(students.id, user.$id))

    return { success: true }
})
