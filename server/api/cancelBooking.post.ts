import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { bookings, credits, lessons, students } from '../database/schema'

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)

    const body = await readBody(event)

    if (!body?.bookingId || typeof body.bookingId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'bookingId is verplicht' })
    }

    // Fetch booking with lesson and student data
    const bookingRows = await db
        .select({
            id: bookings.id,
            lessonId: bookings.lessonId,
            studentId: bookings.studentId,
            source: bookings.source,
            lessonDate: lessons.date,
            lessonType: lessons.type,
        })
        .from(bookings)
        .innerJoin(lessons, eq(bookings.lessonId, lessons.id))
        .where(eq(bookings.id, body.bookingId))
        .limit(1)

    if (bookingRows.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'Boeking niet gevonden' })
    }

    const booking = bookingRows[0]
    const isAdmin = user.labels.includes('admin')

    if (booking.studentId !== user.$id && !isAdmin) {
        throw createError({ statusCode: 403, statusMessage: 'Geen toegang om deze boeking te annuleren' })
    }

    // Check 24h cancellation window
    const lessonDate = new Date(booking.lessonDate)
    const oneDayBefore = new Date(lessonDate.getTime() - 24 * 60 * 60 * 1000)
    if (new Date() >= oneDayBefore && !isAdmin) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Annuleren is niet meer mogelijk (minder dan 24 uur voor de les)'
        })
    }

    // Release the credit — classpass bookings never consumed one, so nothing to release.
    if (booking.source !== 'classpass') {
        const creditRows = await db
            .select()
            .from(credits)
            .where(eq(credits.bookingId, body.bookingId))
            .limit(1)

        if (creditRows.length > 0) {
            await db.update(credits)
                .set({ bookingId: null, usedAt: null })
                .where(eq(credits.id, creditRows[0].id))
        }
    }

    // Delete booking
    await db.delete(bookings).where(eq(bookings.id, body.bookingId))

    return {
        success: true,
        lessonId: booking.lessonId,
    }
})
