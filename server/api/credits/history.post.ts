import { createError } from 'h3'

/**
 * Fetch credit history for a student with lesson details.
 *
 * Body:
 *   - studentId: string (optional for admins, defaults to authenticated user)
 *
 * Returns credits with the associated lesson info (date, type, teacher)
 * for used credits, by looking up the booking -> lesson relationship.
 */
export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)
    const { tablesDB, Query } = useServerAppwrite()
    const config = useRuntimeConfig()

    const body = await readBody(event)

    const targetUserId = body?.studentId && typeof body.studentId === 'string' && user.labels.includes('admin')
        ? body.studentId
        : user.$id

    // Fetch all credits for the student
    let credits: any[] = []
    try {
        const creditsRes = await tablesDB.listRows(
            config.public.database,
            'credits',
            [
                Query.equal('studentId', [targetUserId]),
                Query.orderDesc('createdAt'),
                Query.limit(500),
            ]
        )
        credits = creditsRes.rows ?? []
    } catch {
        // credits collection may not exist yet
        return { credits: [], available: 0 }
    }

    // For used credits, fetch the bookings with lesson data
    const usedBookingIds = credits
        .filter((c: any) => c.bookingId)
        .map((c: any) => c.bookingId)

    let bookingsMap: Record<string, any> = {}

    if (usedBookingIds.length > 0) {
        // Fetch bookings in batches of 100
        for (let i = 0; i < usedBookingIds.length; i += 100) {
            const batch = usedBookingIds.slice(i, i + 100)
            try {
                const bookingsRes = await tablesDB.listRows(
                    config.public.database,
                    'bookings',
                    [
                        Query.equal('$id', batch),
                        Query.select(['*', 'lessons.*']),
                        Query.limit(100),
                    ]
                )
                for (const booking of bookingsRes.rows ?? []) {
                    bookingsMap[booking.$id] = booking
                }
            } catch {
                // Bookings may have been deleted (lesson cancelled etc.)
            }
        }
    }

    // Enrich credits with lesson data
    const enrichedCredits = credits.map((credit: any) => {
        const booking = credit.bookingId ? bookingsMap[credit.bookingId] : null
        const lesson = booking?.lessons && typeof booking.lessons === 'object' ? booking.lessons : null

        return {
            ...credit,
            lesson: lesson ? {
                $id: lesson.$id,
                date: lesson.date,
                type: lesson.type,
                teacher: lesson.teacher,
            } : null,
        }
    })

    const now = new Date()
    const available = credits.filter(
        (c: any) => !c.bookingId && new Date(c.validTo) > now
    ).length

    return {
        credits: enrichedCredits,
        available,
    }
})
