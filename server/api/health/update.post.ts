import { createError } from 'h3'

export default defineEventHandler(async (event) => {
    const authUser = await requireAuth(event)
    const { databases, Query, ID } = useServerAppwrite()
    const config = useRuntimeConfig()

    const body = await readBody(event)

    // --- Input validation ---
    if (!body?.userId || typeof body.userId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'userId is verplicht' })
    }

    // Checking authorization: user can update own health, or admin can
    if (body.userId !== authUser.$id && !authUser.labels.includes('admin')) {
        throw createError({ statusCode: 403, statusMessage: 'Geen toegang' })
    }

    const { injury, pregnancy, dueDate } = body

    // Find existing health record for this user (student)
    // We search by 'student' relationship which stores the userId
    const healthRes = await databases.listDocuments(
        config.public.database,
        'health',
        [
            Query.equal('student', [body.userId]),
            Query.limit(1)
        ]
    )

    const existing = healthRes.documents[0]

    // Verify student document exists before trying to link
    // This is critical because if the student doc is missing, the relationship will fail (or be null)
    try {
        await databases.getDocument(config.public.database, 'students', body.userId)
    } catch (e: any) {
        if (e.code === 404) {
            // Self-healing: Create the missing student document if it doesn't exist
            // This can happen for older accounts or if sync failed
            console.log(`Student document missing for ${body.userId}, creating it...`)
            await databases.createDocument(
                config.public.database,
                'students',
                body.userId,
                {
                    email: authUser.email,
                    name: authUser.name
                }
            )
        } else {
            throw e
        }
    }

    // Build health data WITHOUT the student relationship
    // (relationship will be set via parents.health, not health.student)
    const data: any = {
        injury,
        pregnancy,
        dueDate
    }

    console.log('Saving health data:', JSON.stringify({ ...data, forStudent: body.userId }))

    let result
    if (existing) {
        // Update existing health document (don't touch relationship)
        result = await databases.updateDocument(
            config.public.database,
            'health',
            existing.$id,
            data
        )
    } else {
        // Create health document WITHOUT student field
        result = await databases.createDocument(
            config.public.database,
            'health',
            ID.unique(),
            data
        )

        // Link it from the parent side (students.health)
        // This is required because setting health.student directly fails on production Appwrite
        await databases.updateDocument(
            config.public.database,
            'students',
            body.userId,
            { health: result.$id }
        )
        console.log('Linked health doc via students.health')
    }

    return { result }
})
