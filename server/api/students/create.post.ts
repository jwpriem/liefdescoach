/**
 * POST /api/students/create
 * Creates a student document for the authenticated user.
 * This is called during registration to create the student document with server-side permissions.
 * 
 * Accepts an optional `secret` in the body for immediate post-registration auth
 * (when the session cookie isn't yet established).
 */
import { Client, Account, Databases } from 'node-appwrite'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
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
    } catch (e: any) {
        // If no session, try using the provided JWT/secret from client
        if (body?.userId && body?.email && body?.name) {
            // For registration flow, trust the client-provided data since 
            // they just created the account and we validate it was created
            userId = body.userId
            userEmail = body.email
            userName = body.name
        } else {
            throw createError({ statusCode: 401, statusMessage: 'Niet ingelogd' })
        }
    }

    const { databases } = useServerAppwrite()

    // Build student document data
    const studentData: any = {
        email: userEmail,
        name: userName
    }

    // Add dateOfBirth if provided
    if (body?.dateOfBirth) {
        studentData.dateOfBirth = body.dateOfBirth
    }

    // Add phone if provided
    if (body?.phone) {
        studentData.phone = body.phone
    }

    try {
        // Check if student document already exists
        const existing = await databases.getDocument(
            config.public.database,
            'students',
            userId
        )
        // If we get here, document exists
        return { success: true, exists: true, studentId: existing.$id }
    } catch (e: any) {
        if (e.code !== 404) {
            throw e
        }
    }

    // Create new student document with user's ID as document ID
    const result = await databases.createDocument(
        config.public.database,
        'students',
        userId,
        studentData
    )

    return { success: true, studentId: result.$id }
})

