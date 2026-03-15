import { createError } from 'h3'
import crypto from 'crypto'
import { eq } from 'drizzle-orm'
import { students, otpCodes } from '../../database/schema'

/**
 * Custom OTP flow: checks if user exists, generates a 6-digit code,
 * stores it in the otp_codes table, and sends it via SMTP.
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body?.email || typeof body.email !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'E-mailadres is verplicht' })
    }

    const email = body.email.trim().toLowerCase()
    const db = useDB()

    // 1. Check if user exists
    const userRows = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.email, email))
        .limit(1)

    if (userRows.length === 0) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Er is geen account gevonden met dit e-mailadres. Maak eerst een account aan.'
        })
    }

    const userId = userRows[0].id

    // 2. Delete any existing OTP codes for this email
    await db.delete(otpCodes).where(eq(otpCodes.email, email))

    // 3. Generate a 6-digit code
    const code = crypto.randomInt(100000, 999999).toString()

    // 4. Store with 10-minute expiry
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await db.insert(otpCodes).values({
        id: generateId(),
        email,
        code,
        userId,
        expiresAt,
    })

    // 5. Send via SMTP
    const emailContent = otpEmail(code)

    await smtpTransport.sendMail({
        from: 'Yoga Ravennah <info@ravennah.com>',
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
    })

    return { success: true }
})
