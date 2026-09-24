import { createError } from 'h3'
import { eq, and } from 'drizzle-orm'
import { lessons, bookings, credits } from '../database/schema'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { user, targetId: targetUserId, isOnBehalf } = await requireSelfOrAdmin(event, body?.onBehalfOfUserId)

    if (!body?.lessonId || typeof body.lessonId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'lessonId is verplicht' })
    }

    const isAdmin = user.labels.includes('admin')
    const source: 'regular' | 'classpass' = body.source === 'classpass' ? 'classpass' : 'regular'

    if (source === 'classpass' && !isAdmin) {
        throw createError({ statusCode: 403, statusMessage: 'Alleen admins kunnen Classpass boekingen toevoegen' })
    }

    if (source === 'classpass' && !isOnBehalf) {
        throw createError({ statusCode: 400, statusMessage: 'Selecteer een deelnemer voor de Classpass boeking' })
    }

    // Fetch lesson
    const lessonRows = await db.select().from(lessons).where(eq(lessons.id, body.lessonId)).limit(1)
    if (lessonRows.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'Les niet gevonden' })
    }
    const lesson = lessonRows[0]

    // Admins booking for a student may add them to past lessons (attendance correction)
    if (!isOnBehalf && new Date(lesson.date) <= new Date()) {
        throw createError({ statusCode: 400, statusMessage: 'Kan niet boeken voor een les in het verleden' })
    }

    const allowDuplicateBooking = body.extraSpot === true

    const existingBookings = await db
        .select()
        .from(bookings)
        .where(eq(bookings.lessonId, body.lessonId))

    // Only regular bookings count toward capacity. Classpass bookings ignore capacity.
    if (source === 'regular') {
        const regularCount = existingBookings.filter(b => b.source === 'regular').length
        if (regularCount >= lesson.maxSpots) {
            throw createError({ statusCode: 409, statusMessage: 'Les is vol' })
        }
    }

    if (!allowDuplicateBooking && existingBookings.some(b => b.studentId === targetUserId)) {
        throw createError({ statusCode: 409, statusMessage: 'Gebruiker is al geboekt voor deze les' })
    }

    // Classpass bookings do not consume credits; regular bookings do.
    let creditId: string | null = null
    if (source === 'regular') {
        const credit = await findAvailableCredit(targetUserId)
        if (!credit) {
            throw createError({ statusCode: 402, statusMessage: 'Onvoldoende credits' })
        }
        creditId = credit.id
    }

    const now = new Date()
    const bookingId = generateId()

    await db.insert(bookings).values({
        id: bookingId,
        lessonId: body.lessonId,
        studentId: targetUserId,
        source,
    })

    if (creditId) {
        await db.update(credits)
            .set({ bookingId, usedAt: now })
            .where(eq(credits.id, creditId))
    }

    // Admins correcting attendance on past lessons don't trigger mails; classpass guests often have no email.
    if (source === 'regular' && !(isAdmin && new Date(lesson.date) <= now)) {
        event.waitUntil(
            sendBookingNotifications('confirmation', { lessonId: lesson.id, studentId: targetUserId })
                .catch((err: any) => console.error('[handleBooking] Notifications failed:', err?.message ?? err))
        )
    }

    const regularCountAfter = await countRegularLessonBookings(body.lessonId)

    return {
        success: true,
        lesson: {
            $id: lesson.id,
            date: lesson.date?.toISOString(),
            type: lesson.type,
            teacher: lesson.teacher,
        },
        source,
        spots: lesson.maxSpots - regularCountAfter,
    }
})
