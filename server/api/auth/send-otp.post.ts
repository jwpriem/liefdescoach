import { createError, getRequestIP } from 'h3'
import crypto from 'crypto'
import { eq } from 'drizzle-orm'
import { students, otpCodes } from '../../database/schema'

const OTP_COOLDOWN_MS = 60 * 1000; // 1 minute
const MAX_IP_REQUESTS = 20;

const otpRequestsByEmail = new Map<string, number>();
const otpRequestsByIP = new Map<string, { count: number; firstRequest: number }>();

function lazyCleanup(now: number) {
    if (otpRequestsByEmail.size > 1000) {
        for (const [key, timestamp] of otpRequestsByEmail.entries()) {
            if (now - timestamp > OTP_COOLDOWN_MS) {
                otpRequestsByEmail.delete(key);
            }
        }
    }
    if (otpRequestsByIP.size > 1000) {
        for (const [key, data] of otpRequestsByIP.entries()) {
            if (now - data.firstRequest > OTP_COOLDOWN_MS) {
                otpRequestsByIP.delete(key);
            }
        }
    }
}

/**
 * Custom OTP flow: checks if user exists, generates a 6-digit code,
 * stores it in the otp_codes table, and sends it via SMTP.
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body?.email || typeof body.email !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'E-mailadres is verplicht' })
    }

    const email = body.email.trim().toLowerCase()

    const ip = getRequestIP(event) || 'unknown';
    const now = Date.now();

    lazyCleanup(now);

    const lastRequestByEmail = otpRequestsByEmail.get(email);
    const ipData = otpRequestsByIP.get(ip);

    if (lastRequestByEmail && now - lastRequestByEmail < OTP_COOLDOWN_MS) {
        throw createError({ statusCode: 429, statusMessage: 'Je kunt maximaal één keer per minuut een code aanvragen.' })
    }

    if (ipData) {
        if (now - ipData.firstRequest > OTP_COOLDOWN_MS) {
            // Reset window
            otpRequestsByIP.set(ip, { count: 1, firstRequest: now });
        } else if (ipData.count >= MAX_IP_REQUESTS) {
            throw createError({ statusCode: 429, statusMessage: 'Te veel aanvragen vanaf dit IP. Probeer het later opnieuw.' })
        } else {
            ipData.count++;
        }
    } else {
        otpRequestsByIP.set(ip, { count: 1, firstRequest: now });
    }

    // 1. Check if user exists
    const userRows = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.email, email))
        .limit(1)

    if (userRows.length === 0) {
        // Prevent email enumeration by returning success even if the user does not exist
        return { success: true }
    }

    const userId = userRows[0].id

    // Update rate limit for email before returning
    otpRequestsByEmail.set(email, now);

    event.waitUntil(Promise.resolve().then(async () => {
        try {
            // 2. Delete any existing OTP codes for this email
            await db.delete(otpCodes).where(eq(otpCodes.email, email))

            // 3. Generate a 6-digit code
            const code = crypto.randomInt(100000, 999999).toString()

            // 4. Store with 10-minute expiry
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

            await db.insert(otpCodes).values({
                id: generateId(),
                email,
                code,
                userId,
                expiresAt,
            })

            // 5. Send via SMTP
            const emailContent = otpEmail(code)

            await smtpTransport.sendMail({
                from: 'Yoga Ravennah <info@ravennah.com>',
                to: email,
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text,
            })
        } catch (error) {
            console.error('Error sending OTP:', error)
        }
    }))

    return { success: true }
})
