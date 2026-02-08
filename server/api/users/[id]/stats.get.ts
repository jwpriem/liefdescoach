import { createError } from 'h3'

/**
 * Admin-only endpoint to fetch user statistics.
 *
 * Path params:
 *   - id: User ID
 *
 * Returns:
 *   - bookings: Total number of bookings
 *   - availableCredits: Current available credits
 *   - usedCredits: Total used credits
 *   - revenue: Total revenue calculated from bookings (using credit value or booking price)
 */
export default defineEventHandler(async (event) => {
    await requireAdmin(event) // Ensure only admins can access
    const { tablesDB, Query } = useServerAppwrite()
    const config = useRuntimeConfig()

    const userId = getRouterParam(event, 'id')
    if (!userId) {
        throw createError({ statusCode: 400, statusMessage: 'User ID is required' })
    }

    const revenuePerBooking = parseFloat(config.revenuePerBooking) || 14

    // Credit prices per type
    const creditPrices: Record<string, number> = {
        'credit_1': 16.00,
        'credit_5': 14.50,
        'credit_10': 13.50,
        'credit_20': 12.50,
        // welcome credits are 0
    }

    // 1. Fetch all credits for the user
    let credits: any[] = []
    try {
        const creditsRes = await tablesDB.listRows(
            config.public.database,
            'credits',
            [
                Query.equal('studentId', [userId]),
                Query.limit(1000) // Assuming no user has > 1000 credits for now
            ]
        )
        credits = creditsRes.rows ?? []
    } catch {
        credits = []
    }

    // 2. Fetch all bookings for the user
    let bookings: any[] = []
    try {
        const bookingsRes = await tablesDB.listRows(
            config.public.database,
            'bookings',
            [
                Query.equal('students', [userId]),
                Query.limit(1000)
            ]
        )
        bookings = bookingsRes.rows ?? []
    } catch {
        bookings = []
    }

    // 3. Calculation
    const now = new Date()

    const availableCredits = credits.filter(c => !c.bookingId && new Date(c.validTo) > now).length
    const usedCredits = credits.filter(c => !!c.bookingId).length

    // Map booking IDs to credits to find which booking used which credit
    const bookingCreditMap = new Map<string, any>()
    credits.forEach(c => {
        if (c.bookingId) {
            bookingCreditMap.set(c.bookingId, c)
        }
    })

    let totalRevenue = 0

    bookings.forEach(booking => {
        const usedCredit = bookingCreditMap.get(booking.$id)
        if (usedCredit) {
            // If booked with credit, use credit price
            const price = creditPrices[usedCredit.type] || 0
            totalRevenue += price
        } else {
            // If booked without credit (e.g. paid cash/loos), use default revenue per booking
            totalRevenue += revenuePerBooking
        }
    })

    return {
        bookings: bookings.length,
        availableCredits,
        usedCredits,
        revenue: totalRevenue
    }
})
