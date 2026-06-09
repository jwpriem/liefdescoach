import { createError } from 'h3'
import { eq, and } from 'drizzle-orm'
import { lessons, bookings, credits } from '../database/schema'

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)

    const body = await readBody(event)

    if (!body?.lessonId || typeof body.lessonId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'lessonId is verplicht' })
    }

    const isAdmin = user.labels.includes('admin')
    const source: 'regular' | 'classpass' = body.source === 'classpass' ? 'classpass' : 'regular'

    if (source === 'classpass' && !isAdmin) {
        throw createError({ statusCode: 403, statusMessage: 'Alleen admins kunnen Classpass boekingen toevoegen' })
    }

    let targetUserId = user.$id
    if (body.onBehalfOfUserId && typeof body.onBehalfOfUserId === 'string') {
        if (!isAdmin) {
            throw createError({ statusCode: 403, statusMessage: 'Geen toegang om voor anderen te boeken' })
        }
        targetUserId = body.onBehalfOfUserId
    }

    if (source === 'classpass' && targetUserId === user.$id) {
        throw createError({ statusCode: 400, statusMessage: 'Selecteer een deelnemer voor de Classpass boeking' })
    }

    // ⚡ Bolt: Fetch lesson and existing bookings in a single joined query to reduce database roundtrips.
    const rows = await db
        .select({
            lesson: lessons,
            booking: bookings,
        })
        .from(lessons)
        .leftJoin(bookings, eq(lessons.id, bookings.lessonId))
        .where(eq(lessons.id, body.lessonId))

    if (rows.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'Les niet gevonden' })
    }

    const lesson = rows[0].lesson
    const isAdminBookingForStudent = isAdmin && Boolean(body.onBehalfOfUserId)

    // ⚡ Bolt: Use native getTime() and Date.now() for faster comparison without re-wrapping lesson.date.
    if (!isAdminBookingForStudent && lesson.date.getTime() <= Date.now()) {
        throw createError({ statusCode: 400, statusMessage: 'Kan niet boeken voor een les in het verleden' })
    }

    const allowDuplicateBooking = body.extraSpot === true

    // ⚡ Bolt: Consolidate booking extraction, capacity check, and duplicate detection into a single loop to avoid multiple array traversals.
    let regularCount = 0
    let isAlreadyBooked = false

    for (const r of rows) {
        const b = r.booking
        if (!b) continue

        if (b.source === 'regular') {
            regularCount++
        }
        if (!allowDuplicateBooking && b.studentId === targetUserId) {
            isAlreadyBooked = true
        }
    }

    // Only regular bookings count toward capacity. Classpass bookings ignore capacity.
    if (source === 'regular' && regularCount >= lesson.maxSpots) {
        throw createError({ statusCode: 409, statusMessage: 'Les is vol' })
    }

    if (isAlreadyBooked) {
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

    // ⚡ Bolt: Use the in-memory regularCount (incremented if the new booking was 'regular') to calculate spots, eliminating one DB roundtrip.
    const regularCountAfter = source === 'regular' ? regularCount + 1 : regularCount

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
