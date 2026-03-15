import { createError } from 'h3'
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)
    const config = useRuntimeConfig()

    // Generate a signed token (stateless)
    const expires = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    const payload = JSON.stringify({ userId: user.$id, email: user.email, expires })

    const signature = crypto
        .createHmac('sha256', config.sessionSecret)
        .update(payload)
        .digest('hex')

    const token = Buffer.from(payload).toString('base64') + '.' + signature

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
