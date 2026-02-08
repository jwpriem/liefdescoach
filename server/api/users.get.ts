export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const { users, Query } = useServerAppwrite()

    const res = await users.list(
        [
            Query.orderAsc("name"),
            Query.limit(100)
        ]
    )

    // Fetch health data for these users
    const userIds = res.users.map(u => u.$id)
    const config = useRuntimeConfig()
    const { databases } = useServerAppwrite()

    let healthData: any[] = []
    if (userIds.length > 0) {
        // We can't query health by student ID directly easily if it's a relationship without back-reference or if we didn't index the foreign key in a way we can query list of IDs.
        // Actually we created an index on `studentId` in the script (wait, did we? We created relationship).
        // Best way is to query health collection where studentId is in userIds.
        // But Appwrite queries on relationships can be tricky.
        // We set up `student` attribute on health which relates to `students` collection.
        // The attribute name is `student`.

        // Let's try to fetch health records. 
        // We might need to iterate or do a 'contains' query if supported.
        // Or simply list health records and map them. Since we have limit 100 users, maybe okay to fetch health.
        // A better way with relationships: 
        // We can query `health` collection where `student.$id` is in `userIds`.

        // For now, let's just fetch all health records and match in memory if the dataset is small, 
        // OR fetch per user (slow), OR use `contains` query if we can.
        // Appwrite supports `equal('student.$id', ...)` but usually for one value.

        // Let's try listing health records for the visible users.
        try {
            // We can try fetching by student ID if we have the index.
            // In the script we created index on 'student' (implicit from relationship) or explicit? 
            // We created explicit relationship 'student' on health.
            // Let's rely on looking up via the `students` collection expansion if we were querying that.
            // But here we query `users` (Auth), then we have `students` (DB) which has `health` (DB).

            // Actually, `users.list` returns Auth users. It doesn't return DB documents.
            // We should ideally be querying the `students` collection which has the relationship to `health`.
            // But the current API returns Auth users.

            // Let's fetch the `health` documents where `student` is in the list of IDs.
            // `equal('student.$id', [id1, id2...])` ? Appwrite `equal` accepts array for "OR".

            const healthRes = await databases.listDocuments(
                config.public.database,
                'health',
                [
                    Query.equal('student', userIds),
                    Query.limit(100)
                ]
            )
            healthData = healthRes.documents

            // Debug logging to file
            const fs = await import('node:fs')
            const debugLog = `
Timestamp: ${new Date().toISOString()}
UserIds count: ${userIds.length}
Health rows found: ${healthData.length}
Sample health record: ${healthData.length > 0 ? JSON.stringify(healthData[0]) : 'None'}
            `
            fs.appendFileSync('debug_health.log', debugLog)

        } catch (e) {
            const fs = await import('node:fs')
            fs.appendFileSync('debug_health.log', `Error: ${e}\n`)
            console.error('Failed to fetch health data:', e)
        }
    }

    const healthMap = new Map(healthData.map(h => {
        // Handle both expanded object and ID string cases
        const studentId = h.student && h.student.$id ? h.student.$id : h.student
        return [studentId, h]
    }))

    // Merge health data into users
    const usersWithHealth = res.users.map(u => ({
        ...u,
        health: healthMap.get(u.$id) || null
    }))

    return {
        ...res,
        users: usersWithHealth
    }
})
