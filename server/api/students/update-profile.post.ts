/**
 * POST /api/students/update-profile
 * Updates name, phone, and dateOfBirth for a student.
 * No password required - these are simple profile fields.
 */
import { Users } from 'node-appwrite'

export default defineEventHandler(async (event) => {
    const authUser = await requireAuth(event)
    const config = useRuntimeConfig()
    const { databases, client } = useServerAppwrite()

    const body = await readBody(event)

    // Validate userId
    const userId = body?.userId || authUser.$id

    // Only allow users to update their own profile, or admins to update anyone's
    if (userId !== authUser.$id && !authUser.labels?.includes('admin')) {
        throw createError({ statusCode: 403, statusMessage: 'Geen toegang' })
    }

    // Update name in Appwrite Auth if changed
    if (body.name) {
        try {
            const users = new Users(client)
            await users.updateName(userId, body.name)
        } catch (e: any) {
            console.error('Failed to update name in Auth:', e.message)
        }
    }

    // Prepare update data for students collection
    const updateData: { name?: string; phone?: string | null; dateOfBirth?: string | null } = {}

    if (body.name !== undefined) {
        updateData.name = body.name
    }

    if (body.phone !== undefined) {
        updateData.phone = body.phone || null
    }

    if (body.dateOfBirth !== undefined) {
        updateData.dateOfBirth = body.dateOfBirth || null
    }

    // Only update if there's something to update
    if (Object.keys(updateData).length === 0) {
        return { success: true, message: 'Geen wijzigingen' }
    }

    try {
        const result = await databases.updateDocument(
            config.public.database,
            'students',
            userId,
            updateData
        )

        return {
            success: true,
            name: result.name,
            phone: result.phone,
            dateOfBirth: result.dateOfBirth
        }
    } catch (e: any) {
        // If document not found (404), create it instead (Upsert logic)
        if (e.code === 404) {
            try {
                // Get user details for creation
                let targetEmail = ''
                let targetName = ''

                if (userId === authUser.$id) {
                    targetEmail = authUser.email
                    targetName = authUser.name
                } else {
                    // Admin updating another user - need to fetch their details
                    const users = new Users(client)
                    const targetUser = await users.get(userId)
                    targetEmail = targetUser.email
                    targetName = targetUser.name
                }

                const newStudentData = {
                    email: targetEmail,
                    name: updateData.name || targetName,
                    phone: updateData.phone,
                    dateOfBirth: updateData.dateOfBirth
                }

                const result = await databases.createDocument(
                    config.public.database,
                    'students',
                    userId,
                    newStudentData
                )

                return {
                    success: true,
                    created: true,
                    name: result.name,
                    phone: result.phone,
                    dateOfBirth: result.dateOfBirth
                }

            } catch (createError: any) {
                console.error('Failed to create missing student profile:', createError)
                throw createError
            }
        }
        throw e
    }
})
