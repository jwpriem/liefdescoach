import { eq } from 'drizzle-orm'
import { students } from '../../database/schema'

/**
 * POST /api/students/create
 * Creates a student document for the authenticated user.
 * Called during registration to create the student record.
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    let userId: string
    let userEmail: string
    let userName: string

    // Try to get user from session (normal flow)
    try {
        const authUser = await requireAuth(event)
        userId = authUser.$id
        userEmail = authUser.email
        userName = authUser.name
    } catch {
        // For registration flow, trust the client-provided data
        if (body?.userId && body?.email && body?.name) {
            userId = body.userId
            userEmail = body.email
            userName = body.name
        } else {
            throw createError({ statusCode: 401, statusMessage: 'Niet ingelogd' })
        }
    }

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
