import { createError } from 'h3'

const VALID_LESSON_TYPES = ['hatha yoga', 'guest lesson', 'peachy bum']

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const { tablesDB, ID } = useServerAppwrite()
    const config = useRuntimeConfig()

    const body = await readBody(event)

    // --- Input validation ---
    if (!body?.date || typeof body.date !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Datum is verplicht' })
    }

    if (!body?.type || !VALID_LESSON_TYPES.includes(body.type)) {
        throw createError({ statusCode: 400, statusMessage: 'Ongeldig lestype' })
    }

    const lessonDate = new Date(body.date)
    if (isNaN(lessonDate.getTime())) {
        throw createError({ statusCode: 400, statusMessage: 'Ongeldige datum' })
    }

    if (body.teacher && typeof body.teacher !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Ongeldige docent' })
    }

    const res = await tablesDB.createRow(
        config.public.database,
        'lessons',
        ID.unique(),
        {
            date: body.date,
            type: body.type,
            teacher: body.teacher || null
        }
    )

    return Object.assign({}, res)
})
