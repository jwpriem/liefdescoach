import { eq, desc } from 'drizzle-orm'
import { credits, bookings, lessons } from '../../database/schema'

/**
 * Fetch credit history for a student with lesson details.
 */
export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)

    const body = await readBody(event)

    const targetUserId = body?.studentId && typeof body.studentId === 'string' && user.labels.includes('admin')
        ? body.studentId
        : user.$id

    // Fetch all credits with optional booking+lesson data in one query
    const rows = await db
        .select({
            id: credits.id,
            studentId: credits.studentId,
            bookingId: credits.bookingId,
            type: credits.type,
            validFrom: credits.validFrom,
            validTo: credits.validTo,
            createdAt: credits.createdAt,
            usedAt: credits.usedAt,
            lessonId: lessons.id,
            lessonDate: lessons.date,
            lessonType: lessons.type,
            lessonTeacher: lessons.teacher,
        })
        .from(credits)
        .leftJoin(bookings, eq(credits.bookingId, bookings.id))
        .leftJoin(lessons, eq(bookings.lessonId, lessons.id))
        .where(eq(credits.studentId, targetUserId))
        .orderBy(desc(credits.createdAt))
        .limit(500)

    const enrichedCredits = rows.map((r) => ({
        $id: r.id,
        studentId: r.studentId,
        bookingId: r.bookingId,
        type: r.type,
        validFrom: r.validFrom?.toISOString(),
        validTo: r.validTo?.toISOString(),
        createdAt: r.createdAt?.toISOString(),
        usedAt: r.usedAt?.toISOString() ?? null,
        lesson: r.lessonId ? {
            $id: r.lessonId,
            date: r.lessonDate?.toISOString(),
            type: r.lessonType,
            teacher: r.lessonTeacher,
        } : null,
    }))

    const now = new Date()
    const available = rows.filter(
        (c) => !c.bookingId && c.validTo && new Date(c.validTo) > now
    ).length

    return {
        credits: enrichedCredits,
        available,
    }
})
