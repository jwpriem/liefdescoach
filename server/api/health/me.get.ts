
export default defineEventHandler(async (event) => {
    const authUser = await requireAuth(event)
    const config = useRuntimeConfig()
    const { databases, Query } = useServerAppwrite()

    let health = null
    let dateOfBirth = null
    let phone = null

    try {
        const healthRes = await databases.listDocuments(
            config.public.database,
            'health',
            [
                Query.equal('student', [authUser.$id]),
                Query.limit(1)
            ]
        )
        health = healthRes.documents[0] || null
    } catch (e: any) {
        console.error('Failed to fetch health data for user', authUser.$id, e)
    }

    // Fetch dateOfBirth and phone from students collection
    try {
        const studentDoc = await databases.getDocument(
            config.public.database,
            'students',
            authUser.$id
        )
        dateOfBirth = studentDoc?.dateOfBirth || null
        phone = studentDoc?.phone || null
    } catch (e: any) {
        // Student document might not exist for old users
        console.error('Failed to fetch student data for user', authUser.$id, e)
    }

    return { health, dateOfBirth, phone }
})
