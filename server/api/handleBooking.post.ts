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

    // Fetch lesson
    const lessonRows = await db.select().from(lessons).where(eq(lessons.id, body.lessonId)).limit(1)
    if (lessonRows.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'Les niet gevonden' })
    }
    const lesson = lessonRows[0]

    const isAdminBookingForStudent = isAdmin && Boolean(body.onBehalfOfUserId)

    if (!isAdminBookingForStudent && new Date(lesson.date) <= new Date()) {
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
        if (regularCount >= MAX_LESSON_CAPACITY) {
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
        spots: MAX_LESSON_CAPACITY - regularCountAfter,
    }
})
