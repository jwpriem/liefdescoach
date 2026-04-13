import { eq } from 'drizzle-orm'
import { students } from '../../database/schema'

const DUTCH_MOBILE_REGEX = /^\+316[0-9]{8}$/

/**
 * POST /api/students/submit-phone
 * Student submits their mobile phone number in response to an admin request.
 * Validates as a Dutch mobile number (+316XXXXXXXX), stores it, and clears phoneRequested.
 */
export default defineEventHandler(async (event) => {
    const authUser = await requireAuth(event)

    const body = await readBody(event)
    const { phone } = body

    if (!phone || typeof phone !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Telefoonnummer is verplicht' })
    }

    if (!DUTCH_MOBILE_REGEX.test(phone)) {
        throw createError({ statusCode: 400, statusMessage: 'Voer een geldig Nederlands mobiel nummer in (06XXXXXXXX of +316XXXXXXXX)' })
    }

    await db
        .update(students)
        .set({ phone, phoneRequested: false })
        .where(eq(students.id, authUser.$id))

    return { success: true }
})
