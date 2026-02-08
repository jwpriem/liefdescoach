
export default defineEventHandler(async (event) => {
    const authUser = await requireAuth(event)
    const config = useRuntimeConfig()
    const { databases, Query } = useServerAppwrite()

    try {
        const healthRes = await databases.listDocuments(
            config.public.database,
            'health',
            [
                Query.equal('student', [authUser.$id]),
                Query.limit(1)
            ]
        )

        return {
            health: healthRes.documents[0] || null
        }
    } catch (e: any) {
        console.error('Failed to fetch health data for user', authUser.$id, e)
        return { health: null }
    }
})
