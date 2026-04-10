import { createError, getRequestIP } from 'h3'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { students } from '../../database/schema'

const MAX_IP_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const resetAttemptsByIP = new Map<string, { count: number; firstAttempt: number }>();
let lastCleanup = 0;

function lazyCleanup(now: number) {
    if (resetAttemptsByIP.size > 1000 && now - lastCleanup > 60000) {
        lastCleanup = now;
        for (const [key, data] of resetAttemptsByIP.entries()) {
            if (now - data.firstAttempt > ATTEMPT_WINDOW_MS) {
                resetAttemptsByIP.delete(key);
            }
        }
    }
}

/**
 * POST /api/auth/reset-password
 * Verifies the signed token and sets a new password.
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const config = useRuntimeConfig()

    const ip = getRequestIP(event) || 'unknown';
    const now = Date.now();

    lazyCleanup(now);

    const ipData = resetAttemptsByIP.get(ip);

    if (ipData) {
        if (now - ipData.firstAttempt > ATTEMPT_WINDOW_MS) {
            // Reset window
            resetAttemptsByIP.set(ip, { count: 1, firstAttempt: now });
        } else if (ipData.count >= MAX_IP_ATTEMPTS) {
            throw createError({ statusCode: 429, statusMessage: 'Te veel pogingen vanaf dit IP. Probeer het later opnieuw.' })
        } else {
            ipData.count++;
        }
    } else {
        resetAttemptsByIP.set(ip, { count: 1, firstAttempt: now });
    }

    if (!body?.token || typeof body.token !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Ongeldig token' })
    }
    if (!body?.password || typeof body.password !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Nieuw wachtwoord is verplicht' })
    }
    if (body.password.length < 8) {
        throw createError({ statusCode: 400, statusMessage: 'Wachtwoord moet minimaal 8 tekens zijn' })
    }

    // Verify the signed token
    const payload = verifySignedToken(body.token, config.sessionSecret, 'password-reset')

    // Confirm user still exists
    const rows = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.id, payload.userId))
        .limit(1)

    if (rows.length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'Gebruiker niet gevonden' })
    }

    // Hash and store the new password
    const hash = await bcrypt.hash(body.password, 12)
    await db
        .update(students)
        .set({ passwordHash: hash })
        .where(eq(students.id, payload.userId))

    // Successful reset: clear attempts
    resetAttemptsByIP.delete(ip);

    return { success: true }
})
