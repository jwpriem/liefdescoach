import { createError, getRequestIP } from 'h3'
import crypto from 'crypto'
import { eq } from 'drizzle-orm'
import { otpCodes, students } from '../../database/schema'

const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const verifyAttempts = new Map<string, { count: number; firstAttempt: number }>();
let lastCleanup = 0;

function lazyCleanup(now: number) {
    if (verifyAttempts.size > 1000 && now - lastCleanup > 60000) {
        lastCleanup = now;
        for (const [key, data] of verifyAttempts.entries()) {
            if (now - data.firstAttempt > ATTEMPT_WINDOW_MS) {
                verifyAttempts.delete(key);
            }
        }
    }
}

/**
 * Verifies an OTP code, deletes it from the database,
 * creates a session, and returns the user info.
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body?.email || typeof body.email !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'E-mailadres is verplicht' })
    }
    if (!body?.code || typeof body.code !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Code is verplicht' })
    }

    const email = body.email.trim().toLowerCase()
    const code = body.code.trim()

    const ip = getRequestIP(event) || 'unknown';
    const rateLimitKey = `${ip}:${email}`;
    const now = Date.now();

    lazyCleanup(now);

    const attempt = verifyAttempts.get(rateLimitKey);

    if (attempt) {
        if (now - attempt.firstAttempt > ATTEMPT_WINDOW_MS) {
            // Reset window
            verifyAttempts.set(rateLimitKey, { count: 1, firstAttempt: now });
        } else if (attempt.count >= MAX_ATTEMPTS) {
            throw createError({ statusCode: 429, statusMessage: 'Te veel pogingen. Probeer het later opnieuw.' })
        } else {
            attempt.count++;
        }
    } else {
        verifyAttempts.set(rateLimitKey, { count: 1, firstAttempt: now });
    }

    const genericError = createError({ statusCode: 401, statusMessage: 'Ongeldige of verlopen code. Vraag een nieuwe code aan.' })

    // 1. Look up OTP by email
    const rows = await db
        .select()
        .from(otpCodes)
        .where(eq(otpCodes.email, email))

    if (rows.length === 0) {
        throw genericError
    }

    const otpDoc = rows[0]

    // 2. Check expiry
    if (new Date(otpDoc.expiresAt) < new Date()) {
        await db.delete(otpCodes).where(eq(otpCodes.id, otpDoc.id))
        throw genericError
    }

    // 3. Verify code (constant-time comparison)
    const codeBuffer = Buffer.from(code)
    const storedBuffer = Buffer.from(otpDoc.code)

    if (codeBuffer.length !== storedBuffer.length || !crypto.timingSafeEqual(codeBuffer, storedBuffer)) {
        // Prevent brute force by deleting the OTP immediately after a failed attempt
        await db.delete(otpCodes).where(eq(otpCodes.id, otpDoc.id))
        throw genericError
    }

    // 4. Delete OTP
    await db.delete(otpCodes).where(eq(otpCodes.id, otpDoc.id))

    // 5. Mark email as verified (OTP proves ownership of the email address)
    await db.update(students).set({ emailVerified: true }).where(eq(students.id, otpDoc.userId))

    // 6. Create a session for the user
    await createSession(event, otpDoc.userId)

    // Successful verify: clear attempts
    verifyAttempts.delete(rateLimitKey);

    return { success: true, userId: otpDoc.userId }
})
