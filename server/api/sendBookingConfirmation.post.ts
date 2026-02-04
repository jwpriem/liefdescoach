import { ServerClient } from 'postmark'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
    await requireAuth(event)
    const config = useRuntimeConfig()
    const client = new ServerClient(config.postmark)

    const content = await readBody(event)

    if (!content?.email || typeof content.email !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'E-mail is verplicht' })
    }

    await client.sendEmailWithTemplate({
        "From": "info@ravennah.com",
        "To": content.email,
        "TemplateAlias": "lesson-student",
        "TemplateModel": content
    })

    setResponseStatus(event, 202)
})
