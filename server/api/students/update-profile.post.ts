import { eq } from 'drizzle-orm'
import { students } from '../../database/schema'

/**
 * POST /api/students/update-profile
 * Updates name, phone, and dateOfBirth for a student.
 */
export default defineEventHandler(async (event) => {
    const authUser = await requireAuth(event)
    const db = useDB()

    const body = await readBody(event)

    const userId = body?.userId || authUser.$id

    // Only allow users to update their own profile, or admins to update anyone's
    if (userId !== authUser.$id && !authUser.labels?.includes('admin')) {
        throw createError({ statusCode: 403, statusMessage: 'Geen toegang' })
    }

    // Prepare update data
    const updateData: Record<string, any> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.phone !== undefined) updateData.phone = body.phone || null
    if (body.dateOfBirth !== undefined) updateData.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null

    if (Object.keys(updateData).length === 0) {
        return { success: true, message: 'Geen wijzigingen' }
    }

    // Upsert: try update, create if not exists
    const existing = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.id, userId))
        .limit(1)

    let result: any

    if (existing.length > 0) {
        const updated = await db
            .update(students)
            .set(updateData)
            .where(eq(students.id, userId))
            .returning()
        result = updated[0]
    } else {
        // Create the student record
        const inserted = await db
            .insert(students)
            .values({
                id: userId,
                email: authUser.email,
                name: updateData.name || authUser.name,
                phone: updateData.phone,
                dateOfBirth: updateData.dateOfBirth,
            })
            .returning()
        result = inserted[0]
    }

    return {
        success: true,
        name: result.name,
        phone: result.phone,
        dateOfBirth: result.dateOfBirth?.toISOString() ?? null,
    }
})
