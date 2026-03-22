import { createError } from 'h3'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { students } from '../../database/schema'

/**
 * POST /api/auth/reset-password
 * Verifies the signed token and sets a new password.
 * Works for all users, including those not yet lazy-migrated from Appwrite.
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const config = useRuntimeConfig()

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

    // Hash and store the new password in Neon (completes lazy migration if needed)
    const hash = await bcrypt.hash(body.password, 12)
    await db
        .update(students)
        .set({ passwordHash: hash })
        .where(eq(students.id, payload.userId))

    return { success: true }
})
