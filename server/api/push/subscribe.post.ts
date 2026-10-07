import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { pushSubscriptions, students } from '../../database/schema'

// An APNs device token is a hex string (64 characters today; Apple may lengthen it)
const IOS_TOKEN = /^[0-9a-f]{64,200}$/i

/** Reads either a Web Push subscription or an iPhone device token from the request body. */
function readSubscription(body: any) {
    if (body?.platform === 'ios') {
        if (typeof body.token !== 'string' || !IOS_TOKEN.test(body.token)) {
            throw createError({ statusCode: 400, statusMessage: 'token is ongeldig' })
        }
        return { platform: 'ios', endpoint: body.token.toLowerCase() as string, p256dh: null, auth: null }
    }

    if (!body?.endpoint || typeof body.endpoint !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'endpoint is verplicht' })
    }
    if (!/^https:\/\//i.test(body.endpoint)) {
        throw createError({ statusCode: 400, statusMessage: 'endpoint is ongeldig' })
    }
    if (!body?.keys?.p256dh || !body?.keys?.auth) {
        throw createError({ statusCode: 400, statusMessage: 'keys (p256dh, auth) zijn verplicht' })
    }
    return { platform: 'web', endpoint: body.endpoint as string, p256dh: body.keys.p256dh as string, auth: body.keys.auth as string }
}

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)
    const subscription = readSubscription(await readBody(event))

    // Upsert: a browser or phone belongs to whoever subscribed on it last
    const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
        .limit(1)

    if (existing.length > 0) {
        if (existing[0].platform !== subscription.platform) {
            throw createError({ statusCode: 400, statusMessage: 'endpoint is al in gebruik' })
        }
        await db.update(pushSubscriptions)
            .set({ studentId: user.$id, ...subscription })
            .where(eq(pushSubscriptions.id, existing[0].id))
    } else {
        await db.insert(pushSubscriptions).values({
            id: generateId(),
            studentId: user.$id,
            ...subscription,
        })
    }

    // Enable push notifications on the student
    await db.update(students)
        .set({ pushNotifications: true })
        .where(eq(students.id, user.$id))

    return { success: true }
})
