import { createError } from 'h3'

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)
    const { tablesDB, Query } = useServerAppwrite()
    const config = useRuntimeConfig()

    const body = await readBody(event)

    // --- Input validation ---
    if (!body?.bookingId || typeof body.bookingId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'bookingId is verplicht' })
    }

    // --- Fetch booking with related data ---
    const booking = await tablesDB.getRow(
        config.public.database,
        'bookings',
        body.bookingId,
        [Query.select(['*', 'lessons.*', 'students.*'])]
    )

    if (!booking) {
        throw createError({ statusCode: 404, statusMessage: 'Boeking niet gevonden' })
    }

    // --- Authorization: user can cancel own booking, admin can cancel any ---
    const bookingOwnerId = booking.students?.$id
    const isAdmin = user.labels.includes('admin')

    if (bookingOwnerId !== user.$id && !isAdmin) {
        throw createError({ statusCode: 403, statusMessage: 'Geen toegang om deze boeking te annuleren' })
    }

    // Determine which user gets the credit refund
    let targetUserId = bookingOwnerId
    if (body.onBehalfOfUserId && typeof body.onBehalfOfUserId === 'string' && isAdmin) {
        targetUserId = body.onBehalfOfUserId
    }

    // --- Check cancellation period (must be > 1 day before lesson) ---
    const lessonDate = new Date(booking.lessons?.date)
    const oneDayBefore = new Date(lessonDate.getTime() - 24 * 60 * 60 * 1000)
    if (new Date() >= oneDayBefore && !isAdmin) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Annuleren is niet meer mogelijk (minder dan 24 uur voor de les)'
        })
    }

    // --- Release the credit that was used for this booking ---
    const creditRes = await tablesDB.listRows(
        config.public.database,
        'credits',
        [
            Query.equal('bookingId', [body.bookingId]),
            Query.limit(1),
        ]
    )

    const creditRow = (creditRes.rows ?? [])[0]
    if (creditRow) {
        await tablesDB.updateRow(
            config.public.database,
            'credits',
            creditRow.$id,
            {
                bookingId: null,
                usedAt: null,
            }
        )
    }

    // --- Delete booking ---
    await tablesDB.deleteRow(
        config.public.database,
        'bookings',
        body.bookingId
    )

    return {
        success: true,
        lessonId: booking.lessons?.$id
    }
})
