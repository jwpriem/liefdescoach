import { createError } from 'h3'

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)
    const { tablesDB, Query, ID } = useServerAppwrite()
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

    // --- Fetch lesson ---
    const lesson = await tablesDB.getRow(
        config.public.database,
        'lessons',
        body.lessonId
    )

    if (!lesson) {
        throw createError({ statusCode: 404, statusMessage: 'Les niet gevonden' })
    }

    // Check lesson is in the future
    if (new Date(lesson.date) <= new Date()) {
        throw createError({ statusCode: 400, statusMessage: 'Kan niet boeken voor een les in het verleden' })
    }

    // --- Fetch bookings for this lesson separately ---
    const bookingsRes = await tablesDB.listRows(
        config.public.database,
        'bookings',
        [
            Query.equal('lessons', [body.lessonId]),
            Query.limit(100)
        ]
    )
    const bookings = bookingsRes.rows ?? []

    // Check capacity
    if (bookings.length >= MAX_LESSON_CAPACITY) {
        throw createError({ statusCode: 409, statusMessage: 'Les is vol' })
    }

    // Check duplicate booking
    const alreadyBooked = bookings.some(
        (b: any) => b.students === targetUserId
    )
    if (alreadyBooked) {
        throw createError({ statusCode: 409, statusMessage: 'Gebruiker is al geboekt voor deze les' })
    }

    // --- Find an available credit (not used, not expired) ---
    const now = new Date()
    const availableCreditsRes = await tablesDB.listRows(
        config.public.database,
        'credits',
        [
            Query.equal('studentId', [targetUserId]),
            Query.isNull('bookingId'),
            Query.greaterThan('validTo', now.toISOString()),
            Query.orderAsc('validTo'), // Use the one expiring soonest first (FIFO)
            Query.limit(1),
        ]
    )

    const availableCredits = availableCreditsRes.rows ?? []
    if (availableCredits.length < 1) {
        throw createError({ statusCode: 402, statusMessage: 'Onvoldoende credits' })
    }

    const creditToUse = availableCredits[0]

    // --- Create booking ---
    const booking = await tablesDB.createRow(
        config.public.database,
        'bookings',
        ID.unique(),
        { lessons: body.lessonId, students: targetUserId }
    )

    // --- Claim the credit (idempotent: bookingId acts as the key) ---
    await tablesDB.updateRow(
        config.public.database,
        'credits',
        creditToUse.$id,
        {
            bookingId: booking.$id,
            usedAt: now.toISOString(),
        }
    )

    // --- Return updated booking count ---
    const updatedBookings = await tablesDB.listRows(
        config.public.database,
        'bookings',
        [
            Query.equal('lessons', [body.lessonId]),
            Query.limit(100)
        ]
    )

    return {
        success: true,
        lesson,
        spots: MAX_LESSON_CAPACITY - (updatedBookings.rows?.length ?? 0)
    }
})
