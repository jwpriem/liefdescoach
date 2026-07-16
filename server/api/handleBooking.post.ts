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

    // ⚡ Bolt: Use a single joined query to fetch lesson and its bookings simultaneously, reducing database roundtrips.
    const rows = await db
        .select({
            id: lessons.id,
            date: lessons.date,
            maxSpots: lessons.maxSpots,
            type: lessons.type,
            teacher: lessons.teacher,
            bookingId: bookings.id,
            bookingStudentId: bookings.studentId,
            bookingSource: bookings.source,
        })
        .from(lessons)
        .leftJoin(bookings, eq(lessons.id, bookings.lessonId))
        .where(eq(lessons.id, body.lessonId))

    if (rows.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'Les niet gevonden' })
    }

    const lesson = rows[0]
    const isAdminBookingForStudent = isAdmin && Boolean(body.onBehalfOfUserId)

    // ⚡ Bolt: lesson.date is already a Date object; use getTime() for faster comparison.
    if (!isAdminBookingForStudent && lesson.date.getTime() <= Date.now()) {
        throw createError({ statusCode: 400, statusMessage: 'Kan niet boeken voor een les in het verleden' })
    }

    const allowDuplicateBooking = body.extraSpot === true
    let regularCount = 0
    let alreadyBooked = false

    // ⚡ Bolt: Consolidate capacity and duplicate checks into a single pass over the joined results.
    for (const row of rows) {
        if (!row.bookingId) continue
        if (row.bookingSource === 'regular') {
            regularCount++
        }
        if (row.bookingStudentId === targetUserId) {
            alreadyBooked = true
        }
    }

    // Only regular bookings count toward capacity. Classpass bookings ignore capacity.
    if (source === 'regular' && regularCount >= lesson.maxSpots) {
        throw createError({ statusCode: 409, statusMessage: 'Les is vol' })
    }

    if (!allowDuplicateBooking && alreadyBooked) {
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

    // ⚡ Bolt: Calculate remaining spots using in-memory count, avoiding another database call.
    const spotsLeft = lesson.maxSpots - (source === 'regular' ? regularCount + 1 : regularCount)

    return {
        success: true,
        lesson: {
            $id: lesson.id,
            date: lesson.date?.toISOString(),
            type: lesson.type,
            teacher: lesson.teacher,
        },
        source,
        spots: spotsLeft,
    }
})
