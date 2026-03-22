import crypto from 'node:crypto'
import { createError } from 'h3'

/**
 * Generate a stateless HMAC-SHA256 signed token.
 * Returns `base64(payload).signature`.
 */
export function generateSignedToken(payload: Record<string, any>, secret: string): string {
    const payloadString = JSON.stringify(payload)
    const signature = crypto
        .createHmac('sha256', secret)
        .update(payloadString)
        .digest('hex')
    return Buffer.from(payloadString).toString('base64') + '.' + signature
}

/**
 * Verify a stateless HMAC-SHA256 signed token.
 * Checks signature (timing-safe), expiry, and optional purpose.
 * Returns the parsed payload or throws an H3 error.
 *
 * When `expectedPurpose` is provided, tokens without a `purpose` field
 * are accepted for backward compatibility with already-issued tokens.
 */
export function verifySignedToken(token: string, secret: string, expectedPurpose?: string): Record<string, any> {
    if (!token || typeof token !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Ongeldig token' })
    }

    const [payloadBase64, signature] = token.split('.')

    if (!payloadBase64 || !signature) {
        throw createError({ statusCode: 400, statusMessage: 'Ongeldig token formaat' })
    }

    const payloadString = Buffer.from(payloadBase64, 'base64').toString('utf-8')
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payloadString)
        .digest('hex')

    const signatureBuffer = Buffer.from(signature)
    const expectedSignatureBuffer = Buffer.from(expectedSignature)

    if (signatureBuffer.length !== expectedSignatureBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)) {
        throw createError({ statusCode: 400, statusMessage: 'Ongeldige handtekening' })
    }

    const payload = JSON.parse(payloadString)

    if (Date.now() > payload.expires) {
        throw createError({ statusCode: 400, statusMessage: 'Link is verlopen. Vraag een nieuwe link aan.' })
    }

    if (expectedPurpose && payload.purpose && payload.purpose !== expectedPurpose) {
        throw createError({ statusCode: 400, statusMessage: 'Ongeldig token' })
    }

    return payload
}
