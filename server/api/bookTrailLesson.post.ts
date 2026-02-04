import { createError } from 'h3'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const { tablesDB, ID, Query } = useServerAppwrite()
    const config = useRuntimeConfig()

    const body = await readBody(event)

    // --- Input validation ---
    if (!body?.name || typeof body.name !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Naam is verplicht' })
    }

    if (!body?.email || typeof body.email !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'E-mail is verplicht' })
    }

    if (!body?.lessonId || typeof body.lessonId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'lessonId is verplicht' })
    }

    // --- Check lesson capacity ---
    const lesson = await tablesDB.getRow(
        config.public.database,
        'lessons',
        body.lessonId,
        ['*', 'bookings.*']
    )

    if ((lesson.bookings?.length ?? 0) >= MAX_LESSON_CAPACITY) {
        throw createError({ statusCode: 409, statusMessage: 'Les is vol' })
    }

    const user = await tablesDB.createRow(
        config.public.database,
        'students',
        ID.unique(),
        {
            name: body.name + ' (Proefles)',
            email: body.email
        }
    )

    const res = await tablesDB.createRow(
        config.public.database,
        'bookings',
        ID.unique(),
        {
            students: user.$id,
            lessons: body.lessonId
        }
    )

    return Object.assign({}, res)
})
