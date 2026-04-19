import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { credits, bookings } from '../../../database/schema'

/**
 * Admin-only endpoint to fetch user statistics.
 */
export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const config = useRuntimeConfig()

    const userId = getRouterParam(event, 'id')
    if (!userId) {
        throw createError({ statusCode: 400, statusMessage: 'User ID is required' })
    }

    const revenuePerBooking = parseFloat(config.revenuePerBooking) || 14
    const CLASSPASS_PRICE = 7.10

    const creditPrices: Record<string, number> = {
        'credit_1': 16.00,
        'credit_5': 14.50,
        'credit_10': 13.50,
        'credit_20': 12.50,
    }

    // Fetch credits (bounded)
    const creditRows = await db
        .select()
        .from(credits)
        .where(eq(credits.studentId, userId))
        .limit(2000)

    // Fetch bookings (bounded)
    const bookingRows = await db
        .select()
        .from(bookings)
        .where(eq(bookings.studentId, userId))
        .limit(2000)

    const now = new Date()
    // ⚡ Bolt: Pre-calculate static timestamp outside the loop and use native getTime() for comparison
    const nowTime = now.getTime()

    let availableCredits = 0
    let usedCredits = 0
    const bookingCreditMap = new Map<string, any>()

    // ⚡ Bolt: Consolidated multiple array filters and iterations into a single O(N) loop
    // Expected impact: Transforms O(3N) array iterations into O(N) and prevents intermediate array allocations.
    for (let i = 0; i < creditRows.length; i++) {
        const c = creditRows[i]
        if (c.bookingId) {
            usedCredits++
            bookingCreditMap.set(c.bookingId, c)
        } else if (c.validTo && new Date(c.validTo).getTime() > nowTime) {
            availableCredits++
        }
    }

    let totalRevenue = 0
    bookingRows.forEach(booking => {
        if (booking.source === 'classpass') {
            totalRevenue += CLASSPASS_PRICE
            return
        }
        const usedCredit = bookingCreditMap.get(booking.id)
        if (usedCredit) {
            totalRevenue += creditPrices[usedCredit.type] || 0
        } else {
            totalRevenue += revenuePerBooking
        }
    })

    return {
        bookings: bookingRows.length,
        availableCredits,
        usedCredits,
        revenue: totalRevenue,
    }
})
