import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { students } from '../../database/schema'

/**
 * POST /api/auth/update-profile
 * Update name, email, or phone for the authenticated user.
 */
export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)

    const body = await readBody(event)

    const updateData: Record<string, any> = {}

    if (body.name !== undefined && typeof body.name === 'string') {
        updateData.name = body.name
    }

    if (body.email !== undefined && typeof body.email === 'string') {
        // Check if email is already taken
        const existing = await db
            .select({ id: students.id })
            .from(students)
            .where(eq(students.email, body.email.trim().toLowerCase()))
            .limit(1)

        if (existing.length > 0 && existing[0].id !== user.$id) {
            throw createError({ statusCode: 409, statusMessage: 'E-mailadres is al in gebruik' })
        }

        updateData.email = body.email.trim().toLowerCase()
        updateData.emailVerified = false // Reset verification on email change
    }

    if (body.phone !== undefined) {
        updateData.phone = body.phone || null
    }

    if (Object.keys(updateData).length === 0) {
        return { success: true }
    }

    await db
        .update(students)
        .set(updateData)
        .where(eq(students.id, user.$id))

    return { success: true }
})
