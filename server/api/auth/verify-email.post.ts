import { createError } from 'h3'
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const token = body?.token
    const config = useRuntimeConfig()

    if (!token || typeof token !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Ongeldig token' })
    }

    // 1. Split token inside payload and signature
    const [payloadBase64, signature] = token.split('.')

    if (!payloadBase64 || !signature) {
        throw createError({ statusCode: 400, statusMessage: 'Ongeldig token formaat' })
    }

    // 2. Re-calculate signature
    const payloadString = Buffer.from(payloadBase64, 'base64').toString('utf-8')
    const expectedSignature = crypto
        .createHmac('sha256', config.appwriteKey)
        .update(payloadString)
        .digest('hex')

    if (signature !== expectedSignature) {
        throw createError({ statusCode: 400, statusMessage: 'Ongeldige handtekening' })
    }

    // 3. Check expiration
    const payload = JSON.parse(payloadString)
    if (Date.now() > payload.expires) {
        throw createError({ statusCode: 400, statusMessage: 'Token is verlopen' })
    }

    // 4. Update user in Appwrite
    const { users } = useServerAppwrite()
    await users.updateEmailVerification(payload.userId, true)

    return { success: true }
})
