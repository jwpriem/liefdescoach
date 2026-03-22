import { createError, getHeader, getRequestIP } from 'h3'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { students } from '../../database/schema'

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const loginAttempts = new Map<string, { count: number; lockedUntil: number; lastAttempt: number }>();
const migrationResetSent = new Map<string, number>(); // email -> timestamp of last reset email

// Periodically clean up old rate limit entries to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of loginAttempts.entries()) {
        if (now - value.lastAttempt > LOGIN_LOCKOUT_MS && value.lockedUntil <= now) {
            loginAttempts.delete(key);
        }
    }
    for (const [key, ts] of migrationResetSent.entries()) {
        if (now - ts > LOGIN_LOCKOUT_MS) {
            migrationResetSent.delete(key);
        }
    }
}, 5 * 60 * 1000); // Clean up every 5 minutes

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email + password.
 * If the user has no passwordHash (not yet migrated), sends a password reset
 * email and returns { success: false, reason: 'migration-reset-sent' }.
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body?.email || typeof body.email !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'E-mailadres is verplicht' })
    }
    if (!body?.password || typeof body.password !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Wachtwoord is verplicht' })
    }

    const email = body.email.trim().toLowerCase()
    const password = body.password

    const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
    const rateLimitKey = `${ip}:${email}`;
    const now = Date.now();
    const attempt = loginAttempts.get(rateLimitKey);

    if (attempt) {
        if (attempt.lockedUntil > now) {
            throw createError({ statusCode: 429, statusMessage: 'Te veel inlogpogingen. Probeer het over 15 minuten opnieuw.' })
        }
        // If the lockout period has passed or it's been more than 15 mins since last attempt, reset count
        if (now - attempt.lastAttempt > LOGIN_LOCKOUT_MS) {
            attempt.count = 0;
            attempt.lockedUntil = 0;
        }
    }

    // Look up student by email
    const rows = await db
        .select()
        .from(students)
        .where(eq(students.email, email))
        .limit(1)

    if (rows.length === 0) {
        throw createError({ statusCode: 401, statusMessage: 'Verkeerde e-mailadres of wachtwoord. Probeer opnieuw.' })
    }

    const student = rows[0]

    if (student.passwordHash) {
        // Verify password
        const valid = await bcrypt.compare(password, student.passwordHash)
        if (!valid) {
            if (!attempt) {
                loginAttempts.set(rateLimitKey, { count: 1, lockedUntil: 0, lastAttempt: now });
            } else {
                attempt.count += 1;
                attempt.lastAttempt = now;
                if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
                    attempt.lockedUntil = now + LOGIN_LOCKOUT_MS;
                }
            }
            throw createError({ statusCode: 401, statusMessage: 'Verkeerde e-mailadres of wachtwoord. Probeer opnieuw.' })
        }
    } else {
        // Password not yet migrated — send a password reset email instead
        const lastSent = migrationResetSent.get(email)
        if (!lastSent || now - lastSent > LOGIN_LOCKOUT_MS) {
            const config = useRuntimeConfig()
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
            const emailContent = passwordResetMigrationEmail(resetUrl)

            await smtpTransport.sendMail({
                from: 'Yoga Ravennah <info@ravennah.com>',
                to: student.email,
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text,
            })

            migrationResetSent.set(email, now)
        }

        return { success: false, reason: 'migration-reset-sent' }
    }

    // Successful login: reset attempts
    loginAttempts.delete(rateLimitKey);

    // Create session
    await createSession(event, student.id)

    return {
        success: true,
        user: {
            $id: student.id,
            email: student.email,
            name: student.name,
            labels: student.isAdmin ? ['admin'] : [],
            emailVerification: student.emailVerified,
        },
    }
})
