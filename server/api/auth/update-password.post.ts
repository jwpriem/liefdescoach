import { createError } from 'h3'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { students } from '../../database/schema'

const MAX_UPDATE_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const passwordUpdateAttemptsByUser = new Map<string, { count: number; firstAttempt: number }>();
let lastCleanup = 0;

function lazyCleanup(now: number) {
    if (passwordUpdateAttemptsByUser.size > 1000 && now - lastCleanup > 60 * 1000) {
        lastCleanup = now;
        for (const [key, data] of passwordUpdateAttemptsByUser.entries()) {
            if (now - data.firstAttempt > ATTEMPT_WINDOW_MS) {
                passwordUpdateAttemptsByUser.delete(key);
            }
        }
    }
}

/**
 * POST /api/auth/update-password
 * Change the user's password.
 */
export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)

    const now = Date.now();
    lazyCleanup(now);

    const userData = passwordUpdateAttemptsByUser.get(user.$id);

    if (userData) {
        if (now - userData.firstAttempt > ATTEMPT_WINDOW_MS) {
            // Reset window
            passwordUpdateAttemptsByUser.set(user.$id, { count: 1, firstAttempt: now });
        } else if (userData.count >= MAX_UPDATE_ATTEMPTS) {
            throw createError({ statusCode: 429, statusMessage: 'Te veel pogingen. Probeer het later opnieuw.' })
        } else {
            userData.count++;
        }
    } else {
        passwordUpdateAttemptsByUser.set(user.$id, { count: 1, firstAttempt: now });
    }

    const body = await readBody(event)

    if (!body?.password || typeof body.password !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Huidig wachtwoord is verplicht' })
    }
    if (!body?.newPassword || typeof body.newPassword !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Nieuw wachtwoord is verplicht' })
    }
    if (body.newPassword.length < 8) {
        throw createError({ statusCode: 400, statusMessage: 'Wachtwoord moet minimaal 8 tekens zijn' })
    }

    // Fetch current hash
    const rows = await db
        .select({ passwordHash: students.passwordHash })
        .from(students)
        .where(eq(students.id, user.$id))
        .limit(1)

    if (rows.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'Gebruiker niet gevonden' })
    }

    const currentHash = rows[0].passwordHash

    if (currentHash) {
        // Verify current password
        const valid = await bcrypt.compare(body.password, currentHash)
        if (!valid) {
            throw createError({ statusCode: 401, statusMessage: 'Huidig wachtwoord is onjuist' })
        }
    } else {
        // Password not yet set — user must use the password reset flow first
        throw createError({ statusCode: 400, statusMessage: 'Je wachtwoord moet eerst worden ingesteld via de wachtwoord-herstellen pagina.' })
    }

    // Hash and store new password
    const newHash = await bcrypt.hash(body.newPassword, 12)
    await db
        .update(students)
        .set({ passwordHash: newHash })
        .where(eq(students.id, user.$id))

    // Successful update: clear attempts
    passwordUpdateAttemptsByUser.delete(user.$id);

    return { success: true }
})
