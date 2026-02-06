import { createError } from 'h3'

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)
    const { tablesDB, users, Query, ID } = useServerAppwrite()
    const config = useRuntimeConfig()

    const body = await readBody(event)

    // --- Input validation ---
    if (!body?.lessonId || typeof body.lessonId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'lessonId is verplicht' })
    }

    // Determine which user is being booked (admin can book on behalf of others)
    let targetUserId = user.$id
    if (body.onBehalfOfUserId && typeof body.onBehalfOfUserId === 'string') {
        // Only admins can book on behalf of another user
        if (!user.labels.includes('admin')) {
            throw createError({ statusCode: 403, statusMessage: 'Geen toegang om voor anderen te boeken' })
        }
        targetUserId = body.onBehalfOfUserId
    }

    // --- Fetch lesson with bookings to validate availability ---
    const lesson = await tablesDB.getRow(
        config.public.database,
        'lessons',
        body.lessonId,
        [Query.select(['*', 'bookings.*', 'bookings.students.*'])]
    )

    if (!lesson) {
        throw createError({ statusCode: 404, statusMessage: 'Les niet gevonden' })
    }

    // Check lesson is in the future
    if (new Date(lesson.date) <= new Date()) {
        throw createError({ statusCode: 400, statusMessage: 'Kan niet boeken voor een les in het verleden' })
    }

    // Check capacity
    const currentBookings = lesson.bookings?.length ?? 0
    if (currentBookings >= MAX_LESSON_CAPACITY) {
        throw createError({ statusCode: 409, statusMessage: 'Les is vol' })
    }

    // Check duplicate booking
    const alreadyBooked = lesson.bookings?.some(
        (b: any) => b.students?.$id === targetUserId
    )
    if (alreadyBooked) {
        throw createError({ statusCode: 409, statusMessage: 'Gebruiker is al geboekt voor deze les' })
    }

    // --- Validate credits ---
    const targetUser = await users.get(targetUserId)
    const currentCredits = parseInt(targetUser.prefs?.credits ?? '0', 10)

    if (currentCredits < 1) {
        throw createError({ statusCode: 402, statusMessage: 'Onvoldoende credits' })
    }

    // --- Create booking ---
    await tablesDB.createRow(
        config.public.database,
        'bookings',
        ID.unique(),
        { lessons: body.lessonId, students: targetUserId }
    )

    // --- Deduct credit ---
    const currentPrefs = await users.getPrefs(targetUserId)
    await users.updatePrefs(targetUserId, {
        ...currentPrefs,
        credits: String(currentCredits - 1)
    })

    // --- Return updated lesson data for the client ---
    const updatedLesson = await tablesDB.getRow(
        config.public.database,
        'lessons',
        body.lessonId,
        [Query.select(['*', 'bookings.*', 'bookings.students.*'])]
    )

    return {
        success: true,
        lesson: updatedLesson,
        spots: MAX_LESSON_CAPACITY - (updatedLesson.bookings?.length ?? 0)
    }
})
