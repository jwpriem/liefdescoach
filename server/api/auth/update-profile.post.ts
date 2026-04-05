import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { students } from '../../database/schema'

const MAX_UPDATE_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const profileUpdateAttemptsByUser = new Map<string, { count: number; firstAttempt: number }>();
let lastCleanup = 0;

function lazyCleanup(now: number) {
    if (profileUpdateAttemptsByUser.size > 1000 && now - lastCleanup > 60 * 1000) {
        lastCleanup = now;
        for (const [key, data] of profileUpdateAttemptsByUser.entries()) {
            if (now - data.firstAttempt > ATTEMPT_WINDOW_MS) {
                profileUpdateAttemptsByUser.delete(key);
            }
        }
    }
}

/**
 * POST /api/auth/update-profile
 * Update name, email, or phone for the authenticated user.
 */
export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)

    const now = Date.now();
    lazyCleanup(now);

    const userData = profileUpdateAttemptsByUser.get(user.$id);

    if (userData) {
        if (now - userData.firstAttempt > ATTEMPT_WINDOW_MS) {
            // Reset window
            profileUpdateAttemptsByUser.set(user.$id, { count: 1, firstAttempt: now });
        } else if (userData.count >= MAX_UPDATE_ATTEMPTS) {
            throw createError({ statusCode: 429, statusMessage: 'Te veel pogingen. Probeer het later opnieuw.' })
        } else {
            userData.count++;
        }
    } else {
        profileUpdateAttemptsByUser.set(user.$id, { count: 1, firstAttempt: now });
    }

    const body = await readBody(event)

    const updateData: Record<string, any> = {}

    if (body.name !== undefined && typeof body.name === 'string') {
        updateData.name = body.name
    }

    if (body.email !== undefined && typeof body.email === 'string') {
        // Check if email is already taken
        const existing = await db
            .select({ id: students.id })
            .from(students)
            .where(eq(students.email, body.email.trim().toLowerCase()))
            .limit(1)

        if (existing.length > 0 && existing[0].id !== user.$id) {
            throw createError({ statusCode: 409, statusMessage: 'E-mailadres is al in gebruik' })
        }

        updateData.email = body.email.trim().toLowerCase()
        updateData.emailVerified = false // Reset verification on email change
    }

    if (body.phone !== undefined) {
        updateData.phone = body.phone || null
    }

    if (Object.keys(updateData).length === 0) {
        return { success: true }
    }

    await db
        .update(students)
        .set(updateData)
        .where(eq(students.id, user.$id))

    return { success: true }
})
