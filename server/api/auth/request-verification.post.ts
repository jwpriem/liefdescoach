import { createError } from 'h3'
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)
    const config = useRuntimeConfig()

    // 1. Generate a signed token (stateless)
    // Payload: userId + expiration
    const expires = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    const payload = JSON.stringify({ userId: user.$id, email: user.email, expires })

    // Create signature using the server's private Appwrite key as the secret
    // (It's a consistent secret available on the server)
    const signature = crypto
        .createHmac('sha256', config.appwriteKey)
        .update(payload)
        .digest('hex')

    const token = Buffer.from(payload).toString('base64') + '.' + signature

    // 2. Send email
    const verifyUrl = `${getHeader(event, 'origin')}/verify-email?token=${token}`

    const email = verificationEmail(verifyUrl)

    await smtpTransport.sendMail({
        from: 'Yoga Ravennah <info@ravennah.com>',
        to: user.email,
        subject: email.subject,
        html: email.html,
        text: email.text
    })

    return { success: true }
})
