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

function validateString(val: unknown, minLen: number, maxLen: number, fieldName: string): string {
    if (typeof val !== 'string') {
        throw createError({ statusCode: 400, statusMessage: `Ongeldige waarde voor ${fieldName}` })
    }
    const trimmed = val.trim()
    if (trimmed.length < minLen || trimmed.length > maxLen) {
        throw createError({ statusCode: 400, statusMessage: `Ongeldige lengte voor ${fieldName}` })
    }
    return trimmed
}

/**
 * Server-side email API for simple notification emails.
 *
 * Body: { type: string, data: object }
 * Types: 'contact' | 'new-user'
 *
 * Booking/cancellation emails are sent server-side by handleBooking / cancelBooking
 * via sendBookingNotifications (server/utils/bookingNotifications.ts).
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body?.type || typeof body.type !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Email type is verplicht' })
    }
    if (!body.data || typeof body.data !== 'object') {
        throw createError({ statusCode: 400, statusMessage: 'Email data is verplicht' })
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
        case 'contact': {
            const name = validateString(body.data.name, 1, 100, 'naam')
            const clientEmail = validateString(body.data.email, 3, 255, 'e-mailadres')
            const message = validateString(body.data.message, 1, 5000, 'bericht')
            email = contactEmail({ name, email: clientEmail, message })
            break
        }
        case 'new-user': {
            const name = validateString(body.data.name, 1, 100, 'naam')
            const clientEmail = validateString(body.data.email, 3, 255, 'e-mailadres')
            const phone = typeof body.data.phone === 'string' ? body.data.phone.trim().slice(0, 50) : ''
            const date = typeof body.data.date === 'string' ? body.data.date.trim().slice(0, 50) : new Date().toLocaleDateString('nl-NL')
            email = newUserEmail({ name, email: clientEmail, phone, date })
            break
        }
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
