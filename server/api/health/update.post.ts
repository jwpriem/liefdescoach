import { createError } from 'h3'

export default defineEventHandler(async (event) => {
    const authUser = await requireAuth(event)
    const { tablesDB, Query, ID } = useServerAppwrite()
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
    const healthRes = await tablesDB.listRows(
        config.public.database,
        'health',
        [
            Query.equal('student', [body.userId]),
            Query.limit(1)
        ]
    )

    const existing = healthRes.rows[0]

    // Verify student document exists before trying to link
    // This is critical because if the student doc is missing, the relationship will fail (or be null)
    try {
        await tablesDB.getRow(config.public.database, 'students', body.userId)
    } catch (e: any) {
        if (e.code === 404) {
            // Self-healing: Create the missing student document if it doesn't exist
            // This can happen for older accounts or if sync failed
            console.log(`Student document missing for ${body.userId}, creating it...`)
            await tablesDB.createRow(
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

    const data = {
        injury,
        pregnancy,
        dueDate,
        student: body.userId
    }

    console.log('Saving health data:', JSON.stringify(data))

    let result
    if (existing) {
        // Update
        result = await tablesDB.updateRow(
            config.public.database,
            'health',
            existing.$id,
            data
        )
    } else {
        // Create
        result = await tablesDB.createRow(
            config.public.database,
            'health',
            ID.unique(),
            data
        )
    }

    return { result }
})
