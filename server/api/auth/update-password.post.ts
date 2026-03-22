import { createError } from 'h3'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { students } from '../../database/schema'

/**
 * POST /api/auth/update-password
 * Change the user's password.
 */
export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)

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

    return { success: true }
})
