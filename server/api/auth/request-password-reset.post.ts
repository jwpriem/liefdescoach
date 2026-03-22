import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { students } from '../../database/schema'

/**
 * POST /api/auth/request-password-reset
 * Sends a password reset email with a signed token link.
 * Always returns success to prevent email enumeration.
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body?.email || typeof body.email !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'E-mailadres is verplicht' })
    }

    const email = body.email.trim().toLowerCase()
    const config = useRuntimeConfig()

    // Look up student — if not found, return success anyway (no email enumeration)
    const rows = await db
        .select({ id: students.id, email: students.email })
        .from(students)
        .where(eq(students.email, email))
        .limit(1)

    if (rows.length === 0) {
        return { success: true }
    }

    const student = rows[0]

    // Generate signed token (1 hour expiry)
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
    const emailContent = passwordResetEmail(resetUrl)

    await smtpTransport.sendMail({
        from: 'Yoga Ravennah <info@ravennah.com>',
        to: student.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
    })

    return { success: true }
})
