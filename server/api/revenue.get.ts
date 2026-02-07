/**
 * Admin-only endpoint to calculate revenue data for charting.
 *
 * Query params:
 *   - from: ISO date string (start of range, required)
 *   - to: ISO date string (end of range, required)
 *   - bucket: 'week' | 'month' | 'year' (default: 'week')
 *
 * Revenue = number of bookings per lesson * NUXT_REVENUE_PER_BOOKING (default 14)
 * Cost = number of lessons * NUXT_COST_PER_LESSON (default 50)
 *
 * Returns an array of { label, revenue, cost, profit, bookings, lessons } per bucket.
 */
export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const { tablesDB, Query } = useServerAppwrite()
    const config = useRuntimeConfig()

    const query = getQuery(event)
    const from = query.from as string
    const to = query.to as string
    const bucket = (query.bucket as string) || 'week'

    if (!from || !to) {
        throw createError({ statusCode: 400, statusMessage: 'from en to zijn verplicht' })
    }

    const revenuePerBooking = parseFloat(config.revenuePerBooking) || 14
    const costPerLesson = parseFloat(config.costPerLesson) || 50

    // Fetch all lessons in the date range (paginate)
    let allLessons: any[] = []
    let offset = 0
    const limit = 100
    while (true) {
        const res = await tablesDB.listRows(
            config.public.database,
            'lessons',
            [
                Query.greaterThanEqual('date', from),
                Query.lessThanEqual('date', to),
                Query.orderAsc('date'),
                Query.limit(limit),
                Query.offset(offset),
            ]
        )
        const rows = res.rows ?? []
        allLessons = allLessons.concat(rows)
        if (rows.length < limit) break
        offset += limit
    }

    // Fetch all bookings for these lessons
    const lessonIds = allLessons.map((l: any) => l.$id)
    let allBookings: any[] = []

    for (let i = 0; i < lessonIds.length; i += 100) {
        const batch = lessonIds.slice(i, i + 100)
        if (batch.length === 0) continue
        const res = await tablesDB.listRows(
            config.public.database,
            'bookings',
            [
                Query.equal('lessons', batch),
                Query.limit(500),
            ]
        )
        allBookings = allBookings.concat(res.rows ?? [])
    }

    // Count bookings per lesson
    const bookingsPerLesson: Record<string, number> = {}
    for (const booking of allBookings) {
        const lessonId = typeof booking.lessons === 'string' ? booking.lessons : booking.lessons?.$id
        if (lessonId) {
            bookingsPerLesson[lessonId] = (bookingsPerLesson[lessonId] || 0) + 1
        }
    }

    // Group lessons into buckets
    const buckets: Record<string, { revenue: number; cost: number; bookings: number; lessons: number }> = {}

    for (const lesson of allLessons) {
        const date = new Date(lesson.date)
        const key = getBucketKey(date, bucket)

        if (!buckets[key]) {
            buckets[key] = { revenue: 0, cost: 0, bookings: 0, lessons: 0 }
        }

        const bookingCount = bookingsPerLesson[lesson.$id] || 0
        buckets[key].lessons += 1
        buckets[key].bookings += bookingCount
        buckets[key].revenue += bookingCount * revenuePerBooking
        buckets[key].cost += costPerLesson
    }

    // Convert to sorted array
    const data = Object.entries(buckets)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, val]) => ({
            label: formatBucketLabel(key, bucket),
            revenue: val.revenue,
            cost: val.cost,
            profit: val.revenue - val.cost,
            bookings: val.bookings,
            lessons: val.lessons,
        }))

    return {
        data,
        revenuePerBooking,
        costPerLesson,
    }
})

function getBucketKey(date: Date, bucket: string): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')

    if (bucket === 'year') {
        return `${year}`
    }

    if (bucket === 'month') {
        return `${year}-${month}`
    }

    // week: ISO week number
    const jan1 = new Date(year, 0, 1)
    const dayOfYear = Math.ceil((date.getTime() - jan1.getTime()) / 86400000) + 1
    const weekNum = Math.ceil((dayOfYear + jan1.getDay()) / 7)
    return `${year}-W${String(weekNum).padStart(2, '0')}`
}

function formatBucketLabel(key: string, bucket: string): string {
    if (bucket === 'year') return key
    if (bucket === 'month') {
        const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
        const [y, m] = key.split('-')
        return `${months[parseInt(m) - 1]} ${y}`
    }
    // week
    return key.replace('-W', ' wk ')
}
