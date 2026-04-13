import { eq } from 'drizzle-orm'
import { students } from '../../database/schema'

/**
 * POST /api/students/skip-phone
 * Student skips the phone number request. Clears phoneRequested so the popup
 * won't appear again until the admin triggers a new request.
 */
export default defineEventHandler(async (event) => {
    const authUser = await requireAuth(event)

    await db
        .update(students)
        .set({ phoneRequested: false })
        .where(eq(students.id, authUser.$id))

    return { success: true }
})
