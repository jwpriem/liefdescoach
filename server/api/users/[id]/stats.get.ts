import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { credits, bookings } from '../../../database/schema'

/**
 * Admin-only endpoint to fetch user statistics.
 */
export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const db = useDB()
    const config = useRuntimeConfig()

    const userId = getRouterParam(event, 'id')
    if (!userId) {
        throw createError({ statusCode: 400, statusMessage: 'User ID is required' })
    }

    const revenuePerBooking = parseFloat(config.revenuePerBooking) || 14

    const creditPrices: Record<string, number> = {
        'credit_1': 16.00,
        'credit_5': 14.50,
        'credit_10': 13.50,
        'credit_20': 12.50,
    }

    // Fetch all credits
    const creditRows = await db
        .select()
        .from(credits)
        .where(eq(credits.studentId, userId))

    // Fetch all bookings
    const bookingRows = await db
        .select()
        .from(bookings)
        .where(eq(bookings.studentId, userId))

    const now = new Date()
    const availableCredits = creditRows.filter(c => !c.bookingId && c.validTo && new Date(c.validTo) > now).length
    const usedCredits = creditRows.filter(c => !!c.bookingId).length

    // Map booking IDs to credits
    const bookingCreditMap = new Map<string, any>()
    creditRows.forEach(c => {
        if (c.bookingId) {
            bookingCreditMap.set(c.bookingId, c)
        }
    })

    let totalRevenue = 0
    bookingRows.forEach(booking => {
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
