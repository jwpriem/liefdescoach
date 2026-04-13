import { createError } from 'h3'
import crypto from 'crypto'
import { eq } from 'drizzle-orm'
import { otpCodes, students } from '../../database/schema'

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

    // 1. Look up OTP by email
    const rows = await db
        .select()
        .from(otpCodes)
        .where(eq(otpCodes.email, email))

    if (rows.length === 0) {
        throw createError({ statusCode: 401, statusMessage: 'Geen code gevonden. Vraag een nieuwe code aan.' })
    }

    const otpDoc = rows[0]

    // 2. Check expiry
    if (new Date(otpDoc.expiresAt) < new Date()) {
        await db.delete(otpCodes).where(eq(otpCodes.id, otpDoc.id))
        throw createError({ statusCode: 401, statusMessage: 'Code is verlopen. Vraag een nieuwe code aan.' })
    }

    // 3. Verify code (constant-time comparison)
    const codeBuffer = Buffer.from(code)
    const storedBuffer = Buffer.from(otpDoc.code)

    if (codeBuffer.length !== storedBuffer.length || !crypto.timingSafeEqual(codeBuffer, storedBuffer)) {
        // Prevent brute force by deleting the OTP immediately after a failed attempt
        await db.delete(otpCodes).where(eq(otpCodes.id, otpDoc.id))
        throw createError({ statusCode: 401, statusMessage: 'Ongeldige code. Vraag een nieuwe code aan.' })
    }

    // 4. Delete OTP
    await db.delete(otpCodes).where(eq(otpCodes.id, otpDoc.id))

    // 5. Mark email as verified (OTP proves ownership of the email address)
    await db.update(students).set({ emailVerified: true }).where(eq(students.id, otpDoc.userId))

    // 6. Create a session for the user
    await createSession(event, otpDoc.userId)

    return { success: true, userId: otpDoc.userId }
})
