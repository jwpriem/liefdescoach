import { eq } from 'drizzle-orm'
import { students } from '../../database/schema'

/**
 * POST /api/students/create
 * Creates a student document for the authenticated user.
 * Called during registration to create the student record.
 */
export default defineEventHandler(async (event) => {
    const authUser = await requireAuth(event)
    const body = await readBody(event)

    const userId = authUser.$id
    const userEmail = authUser.email
    const userName = authUser.name

    // Check if student already exists
    const existing = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.id, userId))
        .limit(1)

    if (existing.length > 0) {
        return { success: true, exists: true, studentId: existing[0].id }
    }

    // Build student data
    const studentData: any = {
        id: userId,
        email: userEmail,
        name: userName,
    }

    if (body?.dateOfBirth) {
        studentData.dateOfBirth = new Date(body.dateOfBirth)
    }

    if (body?.phone) {
        studentData.phone = body.phone
    }

    await db.insert(students).values(studentData)

    return { success: true, studentId: userId }
})
