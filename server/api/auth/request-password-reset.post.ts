import { createError, getRequestIP } from 'h3'
import { eq } from 'drizzle-orm'
import { students } from '../../database/schema'

const MAX_IP_REQUESTS = 5;
const REQUEST_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const resetRequestsByIP = new Map<string, { count: number; firstRequest: number }>();

function lazyCleanup(now: number) {
    if (resetRequestsByIP.size > 1000) {
        for (const [key, data] of resetRequestsByIP.entries()) {
            if (now - data.firstRequest > REQUEST_WINDOW_MS) {
                resetRequestsByIP.delete(key);
            }
        }
    }
}

/**
 * POST /api/auth/request-password-reset
 * Sends a password reset email with a signed token link.
 * Always returns success to prevent email enumeration.
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body?.email || typeof body.email !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'E-mailadres is verplicht' })
    }

    const email = body.email.trim().toLowerCase()
    const config = useRuntimeConfig()

    const ip = getRequestIP(event) || 'unknown';
    const now = Date.now();

    lazyCleanup(now);

    const ipData = resetRequestsByIP.get(ip);

    if (ipData) {
        if (now - ipData.firstRequest > REQUEST_WINDOW_MS) {
            // Reset window
            resetRequestsByIP.set(ip, { count: 1, firstRequest: now });
        } else if (ipData.count >= MAX_IP_REQUESTS) {
            throw createError({ statusCode: 429, statusMessage: 'Te veel aanvragen vanaf dit IP. Probeer het later opnieuw.' })
        } else {
            ipData.count++;
        }
    } else {
        resetRequestsByIP.set(ip, { count: 1, firstRequest: now });
    }

    // Look up student — if not found, return success anyway (no email enumeration)
    const rows = await db
        .select({ id: students.id, email: students.email })
        .from(students)
        .where(eq(students.email, email))
        .limit(1)

    if (rows.length === 0) {
        return { success: true }
    }

    const student = rows[0]

    // Generate signed token (1 hour expiry)
    const token = generateSignedToken(
        {
            userId: student.id,
            email: student.email,
            purpose: 'password-reset',
            expires: Date.now() + 60 * 60 * 1000,
        },
        config.sessionSecret
    )

    const resetUrl = `${getHeader(event, 'origin')}/reset-wachtwoord?token=${token}`
    const emailContent = passwordResetEmail(resetUrl)

    await smtpTransport.sendMail({
        from: 'Yoga Ravennah <info@ravennah.com>',
        to: student.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
    })

    return { success: true }
})
