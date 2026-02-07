import { createError } from 'h3'
import crypto from 'crypto'

/**
 * Custom OTP flow: checks if user exists, generates a 6-digit code,
 * stores it in the otp_codes collection, and sends it via SMTP.
 *
 * Body: { email: string }
 * Returns: { success: true } or throws
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body?.email || typeof body.email !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'E-mailadres is verplicht' })
    }

    const email = body.email.trim().toLowerCase()
    const { users, tablesDB, ID, Query } = useServerAppwrite()
    const config = useRuntimeConfig()

    // 1. Check if user exists
    const result = await users.list([Query.equal('email', [email])])

    if (result.total === 0) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Er is geen account gevonden met dit e-mailadres. Maak eerst een account aan.'
        })
    }

    const userId = result.users[0].$id

    // 2. Delete any existing OTP codes for this email
    const existing = await tablesDB.listRows(
        config.public.database,
        'otp_codes',
        [Query.equal('email', [email])]
    )
    for (const doc of existing.documents) {
        await tablesDB.deleteRow(config.public.database, 'otp_codes', doc.$id)
    }

    // 3. Generate a 6-digit code
    const code = crypto.randomInt(100000, 999999).toString()

    // 4. Store in Appwrite with 10-minute expiry
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    await tablesDB.createRow(
        config.public.database,
        'otp_codes',
        ID.unique(),
        { email, code, userId, expiresAt }
    )

    // 5. Send via SMTP
    await smtpTransport.sendMail({
        from: 'Yoga Ravennah <info@ravennah.com>',
        to: email,
        subject: 'Je inlogcode voor Yoga Ravennah',
        text: `Je inlogcode is: ${code}\n\nDeze code is 10 minuten geldig.\n\nHeb je deze code niet aangevraagd? Dan kun je dit bericht negeren.`,
        html: `
            <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #065f46;">Yoga Ravennah</h2>
                <p>Je inlogcode is:</p>
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #065f46; margin: 20px 0;">${code}</p>
                <p style="color: #6b7280; font-size: 14px;">Deze code is 10 minuten geldig.</p>
                <p style="color: #6b7280; font-size: 14px;">Heb je deze code niet aangevraagd? Dan kun je dit bericht negeren.</p>
            </div>
        `,
    })

    return { success: true }
})
