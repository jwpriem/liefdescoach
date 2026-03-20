import webpush from 'web-push'
import { eq } from 'drizzle-orm'
import { pushSubscriptions, students } from '../database/schema'

type PushPayload = {
    title: string
    body: string
    url?: string
}

function getVapidConfig() {
    const config = useRuntimeConfig()
    if (!config.public.vapidPublicKey || !config.vapidPrivateKey) {
        return null
    }
    return {
        publicKey: config.public.vapidPublicKey,
        privateKey: config.vapidPrivateKey,
        email: config.vapidEmail || 'mailto:info@ravennah.com',
    }
}

/**
 * Send a push notification to a single subscription.
 * Returns true if sent, false if the subscription was expired/invalid (and cleaned up).
 */
async function sendToSubscription(
    sub: { id: string; endpoint: string; p256dh: string; auth: string },
    payload: PushPayload
): Promise<boolean> {
    const vapid = getVapidConfig()
    if (!vapid) return false

    webpush.setVapidDetails(vapid.email, vapid.publicKey, vapid.privateKey)

    try {
        await webpush.sendNotification(
            {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify(payload)
        )
        return true
    } catch (err: any) {
        // 410 Gone or 404 = subscription expired, clean up
        if (err?.statusCode === 410 || err?.statusCode === 404) {
            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id))
            console.log(`[Push] Removed expired subscription ${sub.id}`)
        } else {
            console.error(`[Push] Failed to send to ${sub.endpoint}:`, err?.message ?? err)
        }
        return false
    }
}

/**
 * Send a push notification to all subscriptions for a given student.
 */
export async function sendPushToStudent(studentId: string, payload: PushPayload): Promise<number> {
    const subs = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.studentId, studentId))

    let sent = 0
    for (const sub of subs) {
        if (await sendToSubscription(sub, payload)) sent++
    }
    return sent
}

/**
 * Send a push notification to all admin users who have push enabled.
 */
export async function sendPushToAdmins(payload: PushPayload): Promise<number> {
    const adminStudents = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.isAdmin, true))

    let sent = 0
    for (const admin of adminStudents) {
        sent += await sendPushToStudent(admin.id, payload)
    }
    return sent
}
