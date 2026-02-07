import { createError, readBody } from 'h3'

// Replaces nuxt-mail's built-in /mail/send handler which registers with
// uppercase "POST" method, causing a 404 due to h3's lowercase method matching.

const messageConfigs = [{ to: 'info@ravennah.com' }]

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    const configIndex = body?.config ?? 0
    const config = messageConfigs[configIndex]
    if (!config) {
        throw createError({ statusCode: 400, statusMessage: `Message config not found at index ${configIndex}.` })
    }

    const { config: _config, to: _to, cc: _cc, bcc: _bcc, ...mailBody } = body

    try {
        await smtpTransport.sendMail({
            ...mailBody,
            ...config,
        })
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message })
    }

    return ''
})
