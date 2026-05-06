import { createError } from 'h3'

const MAX_VERIFICATION_REQUESTS = 3;
const REQUEST_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const verificationRequestsByUser = new Map<string, { count: number; firstRequest: number }>();
let lastCleanup = 0;

function lazyCleanup(now: number) {
    if (verificationRequestsByUser.size > 1000 && now - lastCleanup > 60000) {
        lastCleanup = now;
        for (const [key, data] of verificationRequestsByUser.entries()) {
            if (now - data.firstRequest > REQUEST_WINDOW_MS) {
                verificationRequestsByUser.delete(key);
            }
        }
    }
}

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)
    const config = useRuntimeConfig()

    const now = Date.now();
    lazyCleanup(now);

    const userData = verificationRequestsByUser.get(user.$id);

    if (userData) {
        if (now - userData.firstRequest > REQUEST_WINDOW_MS) {
            // Reset window
            verificationRequestsByUser.set(user.$id, { count: 1, firstRequest: now });
        } else if (userData.count >= MAX_VERIFICATION_REQUESTS) {
            throw createError({ statusCode: 429, statusMessage: 'Te veel aanvragen. Probeer het later opnieuw.' })
        } else {
            userData.count++;
        }
    } else {
        verificationRequestsByUser.set(user.$id, { count: 1, firstRequest: now });
    }

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

    event.waitUntil(Promise.resolve().then(async () => {
        try {
            await smtpTransport.sendMail({
                from: 'Yoga Ravennah <info@ravennah.com>',
                to: user.email,
                subject: email.subject,
                html: email.html,
                text: email.text
            })
        } catch (error) {
            console.error('Error sending verification email:', error)
        }
    }))

    return { success: true }
})
