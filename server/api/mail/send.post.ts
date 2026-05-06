import { createError, getRequestIP } from 'h3'

const MAX_IP_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const requestsByIP = new Map<string, { count: number; firstRequest: number }>();
let lastCleanup = 0;

function lazyCleanup(now: number) {
    if (requestsByIP.size > 1000 && now - lastCleanup > 60000) {
        lastCleanup = now;
        for (const [key, data] of requestsByIP.entries()) {
            if (now - data.firstRequest > RATE_LIMIT_WINDOW_MS) {
                requestsByIP.delete(key);
            }
        }
    }
}

/**
 * Server-side email API for simple notification emails.
 *
 * Body: { type: string, data: object }
 * Types: 'contact' | 'new-user'
 *
 * Booking/cancellation emails are handled by their own dedicated endpoints
 * (sendBookingConfirmation / SendBookingCancellation) which send 2 emails each.
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body?.type || typeof body.type !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Email type is verplicht' })
    }

    const ip = getRequestIP(event) || 'unknown';
    const now = Date.now();

    lazyCleanup(now);

    const ipData = requestsByIP.get(ip);

    if (ipData) {
        if (now - ipData.firstRequest > RATE_LIMIT_WINDOW_MS) {
            requestsByIP.set(ip, { count: 1, firstRequest: now });
        } else if (ipData.count >= MAX_IP_REQUESTS) {
            throw createError({ statusCode: 429, statusMessage: 'Te veel aanvragen vanaf dit IP. Probeer het later opnieuw.' });
        } else {
            ipData.count++;
        }
    } else {
        requestsByIP.set(ip, { count: 1, firstRequest: now });
    }

    let email: { subject: string; html: string; text: string }
    let to = 'info@ravennah.com'

    switch (body.type) {
        case 'contact':
            email = contactEmail(body.data)
            break
        case 'new-user':
            email = newUserEmail(body.data)
            break
        default:
            throw createError({ statusCode: 400, statusMessage: `Onbekend email type: ${body.type}` })
    }

    event.waitUntil(Promise.resolve().then(async () => {
        try {
            await smtpTransport.sendMail({
                from: 'Yoga Ravennah <info@ravennah.com>',
                to,
                subject: email.subject,
                html: email.html,
                text: email.text,
            })
        } catch (err: any) {
            console.error(`[mail/send] Failed to send ${body.type} email:`, err?.message ?? err)
        }
    }))

    return { success: true }
})
