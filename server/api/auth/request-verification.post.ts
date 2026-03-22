export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)
    const config = useRuntimeConfig()

    // Generate a signed token (stateless, 24h expiry)
    const token = generateSignedToken(
        {
            userId: user.$id,
            email: user.email,
            purpose: 'email-verification',
            expires: Date.now() + 24 * 60 * 60 * 1000,
        },
        config.sessionSecret
    )

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
