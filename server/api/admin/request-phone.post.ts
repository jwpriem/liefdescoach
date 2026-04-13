import { eq } from 'drizzle-orm'
import { students } from '../../database/schema'

/**
 * POST /api/admin/request-phone
 * Admin sets phoneRequested = true for a student, prompting them
 * to provide their mobile phone number on next visit.
 */
export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const body = await readBody(event)
    const { userId } = body

    if (!userId) {
        throw createError({ statusCode: 400, statusMessage: 'userId is verplicht' })
    }

    const updated = await db
        .update(students)
        .set({ phoneRequested: true })
        .where(eq(students.id, userId))
        .returning({ id: students.id })

    if (updated.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'Gebruiker niet gevonden' })
    }

    return { success: true }
})
