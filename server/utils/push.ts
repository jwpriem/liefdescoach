import webpush from 'web-push'
import { eq } from 'drizzle-orm'
import { pushSubscriptions, students } from '../database/schema'
import type { PushPayload } from '../../shared/push'
import { sendApns, type PushOutcome } from './apns'

type Subscription = { id: string; platform: string; endpoint: string; p256dh: string | null; auth: string | null }

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

/** Sends through Web Push. Never throws. */
async function sendWebPush(sub: Subscription, payload: PushPayload): Promise<PushOutcome> {
    const vapid = getVapidConfig()
    if (!vapid || !sub.p256dh || !sub.auth) return 'failed'

    webpush.setVapidDetails(vapid.email, vapid.publicKey, vapid.privateKey)

    try {
        await webpush.sendNotification(
            {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify(payload)
        )
        return 'sent'
    } catch (err: any) {
        // 410 Gone or 404 = subscription expired
        if (err?.statusCode === 410 || err?.statusCode === 404) return 'invalid-token'
        console.error(`[Push] Failed to send to ${sub.endpoint}:`, err?.message ?? err)
        return 'failed'
    }
}

/**
 * Send a push notification to a single subscription: an iPhone through APNs, a browser through Web Push.
 * Returns true if sent; a subscription the push service no longer knows is cleaned up.
 */
async function sendToSubscription(sub: Subscription, payload: PushPayload): Promise<boolean> {
    const outcome = sub.platform === 'ios' ? await sendApns(sub.endpoint, payload) : await sendWebPush(sub, payload)

    if (outcome === 'invalid-token') {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id))
        console.log(`[Push] Removed expired subscription ${sub.id}`)
    }
    return outcome === 'sent'
}

/**
 * Send a push notification to all subscriptions for a given student.
 * Never throws — returns 0 on any failure so callers are not impacted.
 */
export async function sendPushToStudent(studentId: string, payload: PushPayload): Promise<number> {
    try {
        const subs = await db
            .select()
            .from(pushSubscriptions)
            .where(eq(pushSubscriptions.studentId, studentId))

        let sent = 0
        for (const sub of subs) {
            if (await sendToSubscription(sub, payload)) sent++
        }
        return sent
    } catch (err: any) {
        console.error(`[Push] sendPushToStudent failed for ${studentId}:`, err?.message ?? err)
        return 0
    }
}

/**
 * Send a push notification to all admin users who have push enabled.
 * Never throws — returns 0 on any failure so callers are not impacted.
 */
export async function sendPushToAdmins(payload: PushPayload): Promise<number> {
    try {
        const adminStudents = await db
            .select({ id: students.id })
            .from(students)
            .where(eq(students.isAdmin, true))

        let sent = 0
        for (const admin of adminStudents) {
            sent += await sendPushToStudent(admin.id, payload)
        }
        return sent
    } catch (err: any) {
        console.error('[Push] sendPushToAdmins failed:', err?.message ?? err)
        return 0
    }
}
