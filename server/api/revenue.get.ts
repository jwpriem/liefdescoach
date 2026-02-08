/**
 * Admin-only endpoint to calculate revenue data for charting.
 *
 * Query params:
 *   - from: ISO date string (start of range, required)
 *   - to: ISO date string (end of range, required)
 *   - bucket: 'week' | 'month' | 'year' (default: 'week')
 *
 * Revenue logic:
 *   - If booking has a linked credit, use that credit's per-class price.
 *   - If no credit (legacy), use NUXT_REVENUE_PER_BOOKING (default 14).
 *
 * Cost = number of lessons * NUXT_COST_PER_LESSON (default 50)
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

    // Pricing map per credit type
    const PRICE_MAP: Record<string, number> = {
        'credit_1': 16.00,
        'credit_5': 14.50,
        'credit_10': 13.50,
        'credit_20': 12.50
    }

    // 1. Fetch all lessons in the date range
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

    // 2. Fetch all bookings for these lessons
    const lessonIds = allLessons.map((l: any) => l.$id)
    let allBookings: any[] = []

    for (let i = 0; i < lessonIds.length; i += 100) {
        const batch = lessonIds.slice(i, i + 100)
        if (batch.length === 0) continue
        let batchOffset = 0
        while (true) {
            const res = await tablesDB.listRows(
                config.public.database,
                'bookings',
                [
                    Query.equal('lessons', batch),
                    Query.limit(limit),
                    Query.offset(batchOffset),
                ]
            )
            const rows = res.rows ?? []
            allBookings = allBookings.concat(rows)
            if (rows.length < limit) break
            batchOffset += limit
        }
    }

    // 3. Fetch credits used for these bookings to determine exact price
    const bookingIds = allBookings.map((b: any) => b.$id)
    const bookingToPriceMap: Record<string, number> = {}

    // We only need to query if we have bookings
    if (bookingIds.length > 0) {
        for (let i = 0; i < bookingIds.length; i += 100) {
            const batch = bookingIds.slice(i, i + 100)
            if (batch.length === 0) continue

            let batchOffset = 0
            while (true) {
                // We might need to handle the case where 'credits' collection doesn't exist yet in legacy DBs
                try {
                    const res = await tablesDB.listRows(
                        config.public.database,
                        'credits',
                        [
                            Query.equal('bookingId', batch),
                            Query.limit(limit),
                            Query.offset(batchOffset),
                        ]
                    )
                    const rows = res.rows ?? []

                    for (const credit of rows) {
                        if (credit.bookingId && credit.type && PRICE_MAP[credit.type]) {
                            bookingToPriceMap[credit.bookingId] = PRICE_MAP[credit.type]
                        }
                    }

                    if (rows.length < limit) break
                    batchOffset += limit
                } catch (e) {
                    console.error('Failed to fetch credits:', e)
                    break
                }
            }
        }
    }

    // 4. Calculate stats per lesson
    const bookingCountPerLesson: Record<string, number> = {}
    const revenuePerLesson: Record<string, number> = {}

    for (const booking of allBookings) {
        const lessonId = typeof booking.lessons === 'string' ? booking.lessons : booking.lessons?.$id
        if (lessonId) {
            bookingCountPerLesson[lessonId] = (bookingCountPerLesson[lessonId] || 0) + 1

            // Use specific credit price if available, otherwise default fallback
            const price = bookingToPriceMap[booking.$id] || revenuePerBooking
            revenuePerLesson[lessonId] = (revenuePerLesson[lessonId] || 0) + price
        }
    }

    // 5. Group into buckets
    const buckets: Record<string, { revenue: number; cost: number; bookings: number; lessons: number }> = {}

    for (const lesson of allLessons) {
        const date = new Date(lesson.date)
        const key = getBucketKey(date, bucket)

        if (!buckets[key]) {
            buckets[key] = { revenue: 0, cost: 0, bookings: 0, lessons: 0 }
        }

        const count = bookingCountPerLesson[lesson.$id] || 0
        const revenue = revenuePerLesson[lesson.$id] || 0

        buckets[key].lessons += 1
        buckets[key].bookings += count
        buckets[key].revenue += revenue
        buckets[key].cost += costPerLesson
    }

    // 6. Convert to sorted array
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
        revenuePerBooking, // still returned for reference/frontend usage if needed
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
