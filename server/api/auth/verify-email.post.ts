import { createError } from 'h3'
import crypto from 'node:crypto'
import { eq } from 'drizzle-orm'
import { students } from '../../database/schema'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const token = body?.token
    const config = useRuntimeConfig()

    if (!token || typeof token !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Ongeldig token' })
    }

    const [payloadBase64, signature] = token.split('.')

    if (!payloadBase64 || !signature) {
        throw createError({ statusCode: 400, statusMessage: 'Ongeldig token formaat' })
    }

    const payloadString = Buffer.from(payloadBase64, 'base64').toString('utf-8')
    const expectedSignature = crypto
        .createHmac('sha256', config.sessionSecret)
        .update(payloadString)
        .digest('hex')

    if (signature !== expectedSignature) {
        throw createError({ statusCode: 400, statusMessage: 'Ongeldige handtekening' })
    }

    const payload = JSON.parse(payloadString)
    if (Date.now() > payload.expires) {
        throw createError({ statusCode: 400, statusMessage: 'Token is verlopen' })
    }

    // Update email verification in Neon
    await db
        .update(students)
        .set({ emailVerified: true })
        .where(eq(students.id, payload.userId))

    return { success: true }
})
