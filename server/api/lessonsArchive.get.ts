export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const { tablesDB, Query } = useServerAppwrite()
    const config = useRuntimeConfig()
    const fromDate = new Date()

    const res = await tablesDB.listRows(
        config.public.database,
        'lessons',
        [
            Query.select(['*', 'bookings.*']),
            Query.orderAsc("date"),
            Query.lessThanEqual("date", fromDate.toISOString()),
            Query.limit(100)
        ]
    )

    return Object.assign({}, res)
})
