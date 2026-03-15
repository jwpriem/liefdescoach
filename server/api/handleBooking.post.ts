import { createError } from 'h3'
import { eq, and, isNull, gt, asc, count as countFn } from 'drizzle-orm'
import { lessons, bookings, credits } from '../database/schema'

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)
    const db = useDB()

    const body = await readBody(event)

    if (!body?.lessonId || typeof body.lessonId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'lessonId is verplicht' })
    }

    let targetUserId = user.$id
    if (body.onBehalfOfUserId && typeof body.onBehalfOfUserId === 'string') {
        if (!user.labels.includes('admin')) {
            throw createError({ statusCode: 403, statusMessage: 'Geen toegang om voor anderen te boeken' })
        }
        targetUserId = body.onBehalfOfUserId
    }

    // Fetch lesson
    const lessonRows = await db.select().from(lessons).where(eq(lessons.id, body.lessonId)).limit(1)
    if (lessonRows.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'Les niet gevonden' })
    }
    const lesson = lessonRows[0]

    if (new Date(lesson.date) <= new Date()) {
        throw createError({ statusCode: 400, statusMessage: 'Kan niet boeken voor een les in het verleden' })
    }

    const allowDuplicateBooking = body.extraSpot === true

    // Check capacity and duplicates
    const existingBookings = await db
        .select()
        .from(bookings)
        .where(eq(bookings.lessonId, body.lessonId))

    if (existingBookings.length >= MAX_LESSON_CAPACITY) {
        throw createError({ statusCode: 409, statusMessage: 'Les is vol' })
    }

    if (!allowDuplicateBooking && existingBookings.some(b => b.studentId === targetUserId)) {
        throw createError({ statusCode: 409, statusMessage: 'Gebruiker is al geboekt voor deze les' })
    }

    // Find available credit (FIFO by expiry)
    const credit = await findAvailableCredit(targetUserId)
    if (!credit) {
        throw createError({ statusCode: 402, statusMessage: 'Onvoldoende credits' })
    }

    const now = new Date()
    const bookingId = generateId()

    // Create booking
    await db.insert(bookings).values({
        id: bookingId,
        lessonId: body.lessonId,
        studentId: targetUserId,
    })

    // Claim credit
    await db.update(credits)
        .set({ bookingId, usedAt: now })
        .where(eq(credits.id, credit.id))

    // Count updated bookings
    const updatedCount = await countLessonBookings(body.lessonId)

    return {
        success: true,
        lesson: {
            $id: lesson.id,
            date: lesson.date?.toISOString(),
            type: lesson.type,
            teacher: lesson.teacher,
        },
        spots: MAX_LESSON_CAPACITY - updatedCount,
    }
})
