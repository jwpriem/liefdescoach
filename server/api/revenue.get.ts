import { and, gte, lte, eq, asc } from 'drizzle-orm'
import { lessons, bookings, credits } from '../database/schema'

/**
 * Admin-only endpoint to calculate revenue data for charting.
 */
export default defineEventHandler(async (event) => {
    await requireAdmin(event)
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

    const PRICE_MAP: Record<string, number> = {
        'credit_1': 16.00,
        'credit_5': 14.50,
        'credit_10': 13.50,
        'credit_20': 12.50,
    }

    // Fetch all lessons, bookings, and credits in the date range using joins
    const rows = await db
        .select({
            lessonId: lessons.id,
            lessonDate: lessons.date,
            bookingId: bookings.id,
            creditType: credits.type,
        })
        .from(lessons)
        .leftJoin(bookings, eq(lessons.id, bookings.lessonId))
        .leftJoin(credits, eq(bookings.id, credits.bookingId))
        .where(
            and(
                gte(lessons.date, new Date(from)),
                lte(lessons.date, new Date(to))
            )
        )
        .orderBy(asc(lessons.date))
        .limit(5000)

    // Group into buckets
    const lessonsSeen = new Set<string>()
    const buckets: Record<string, { revenue: number; cost: number; bookings: number; lessons: number }> = {}

    for (const row of rows) {
        const date = new Date(row.lessonDate)
        const key = getBucketKey(date, bucket)

        if (!buckets[key]) {
            buckets[key] = { revenue: 0, cost: 0, bookings: 0, lessons: 0 }
        }

        // Count each lesson only once
        if (!lessonsSeen.has(row.lessonId)) {
            lessonsSeen.add(row.lessonId)
            buckets[key].lessons += 1
            buckets[key].cost += costPerLesson
        }

        // Count booking if present (left join may produce null)
        if (row.bookingId) {
            buckets[key].bookings += 1
            const price = row.creditType ? (PRICE_MAP[row.creditType] || revenuePerBooking) : revenuePerBooking
            buckets[key].revenue += price
        }
    }

    const data = Object.entries(buckets)
        // ⚡ Bolt: Prevent expensive localeCompare inside sort loop by using basic comparison operators
        .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
        .map(([key, val]) => ({
            label: formatBucketLabel(key, bucket),
            revenue: val.revenue,
            cost: val.cost,
            profit: val.revenue - val.cost,
            bookings: val.bookings,
            lessons: val.lessons,
        }))

    return { data, revenuePerBooking, costPerLesson }
})

function getBucketKey(date: Date, bucket: string): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')

    if (bucket === 'year') return `${year}`
    if (bucket === 'month') return `${year}-${month}`

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
    return key.replace('-W', ' wk ')
}
