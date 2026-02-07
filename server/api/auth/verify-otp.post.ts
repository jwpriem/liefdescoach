import { createError } from 'h3'

/**
 * Verifies an OTP code, deletes it from the database,
 * creates an Appwrite session, and returns the session secret.
 *
 * Body: { email: string, code: string }
 * Returns: { sessionSecret: string }
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
    const { tablesDB, users, Query } = useServerAppwrite()
    const config = useRuntimeConfig()

    // 1. Look up OTP document by email
    const result = await tablesDB.listRows(
        config.public.database,
        'otp_codes',
        [Query.equal('email', [email])]
    )

    if (result.total === 0) {
        throw createError({ statusCode: 401, statusMessage: 'Geen code gevonden. Vraag een nieuwe code aan.' })
    }

    const otpDoc = result.documents[0]

    // 2. Check expiry
    if (new Date(otpDoc.expiresAt) < new Date()) {
        // Clean up expired code
        await tablesDB.deleteRow(config.public.database, 'otp_codes', otpDoc.$id)
        throw createError({ statusCode: 401, statusMessage: 'Code is verlopen. Vraag een nieuwe code aan.' })
    }

    // 3. Verify code (constant-time comparison to prevent timing attacks)
    const codeBuffer = Buffer.from(code)
    const storedBuffer = Buffer.from(otpDoc.code)

    if (codeBuffer.length !== storedBuffer.length || !require('crypto').timingSafeEqual(codeBuffer, storedBuffer)) {
        throw createError({ statusCode: 401, statusMessage: 'Ongeldige code. Probeer opnieuw.' })
    }

    // 4. Delete the OTP document
    await tablesDB.deleteRow(config.public.database, 'otp_codes', otpDoc.$id)

    // 5. Create an Appwrite session for the user via the server SDK
    const session = await users.createSession(otpDoc.userId)

    return { sessionSecret: session.secret }
})
