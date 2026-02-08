
export default defineEventHandler(async (event) => {
    const authUser = await requireAuth(event)
    const config = useRuntimeConfig()
    const { tablesDB, Query } = useServerAppwrite()

    try {
        const healthRes = await tablesDB.listRows(
            config.public.database,
            'health',
            [
                Query.equal('student', [authUser.$id]),
                Query.limit(1)
            ]
        )

        return {
            health: healthRes.rows[0] || null
        }
    } catch (e: any) {
        console.error('Failed to fetch health data for user', authUser.$id, e)
        return { health: null }
    }
})
