import { createError, getRequestIP } from 'h3'
import { eq } from 'drizzle-orm'
import { students } from '../../database/schema'

const MAX_IP_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const verifyAttemptsByIP = new Map<string, { count: number; firstAttempt: number }>();
let lastCleanup = 0;

function lazyCleanup(now: number) {
    if (verifyAttemptsByIP.size > 1000 && now - lastCleanup > 60000) {
        lastCleanup = now;
        for (const [key, data] of verifyAttemptsByIP.entries()) {
            if (now - data.firstAttempt > ATTEMPT_WINDOW_MS) {
                verifyAttemptsByIP.delete(key);
            }
        }
    }
}

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const config = useRuntimeConfig()

    const ip = getRequestIP(event) || 'unknown';
    const now = Date.now();

    lazyCleanup(now);

    const ipData = verifyAttemptsByIP.get(ip);

    if (ipData) {
        if (now - ipData.firstAttempt > ATTEMPT_WINDOW_MS) {
            // Reset window
            verifyAttemptsByIP.set(ip, { count: 1, firstAttempt: now });
        } else if (ipData.count >= MAX_IP_ATTEMPTS) {
            throw createError({ statusCode: 429, statusMessage: 'Te veel pogingen vanaf dit IP. Probeer het later opnieuw.' })
        } else {
            ipData.count++;
        }
    } else {
        verifyAttemptsByIP.set(ip, { count: 1, firstAttempt: now });
    }

    const payload = verifySignedToken(body?.token, config.sessionSecret, 'email-verification')

    // Update email verification in Neon
    await db
        .update(students)
        .set({ emailVerified: true })
        .where(eq(students.id, payload.userId))

    // Successful verify: clear attempts
    verifyAttemptsByIP.delete(ip);

    return { success: true }
})
