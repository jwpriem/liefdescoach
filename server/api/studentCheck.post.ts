import { createError } from 'h3'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const { tablesDB, Query } = useServerAppwrite()
    const config = useRuntimeConfig()

    const body = await readBody(event)

    if (!body?.email || typeof body.email !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'E-mail is verplicht' })
    }

    const res = await tablesDB.listRows(
        config.public.database,
        'students',
        [
            Query.equal('email', [body.email])
        ]
    )

    return Object.assign({}, res)
})
