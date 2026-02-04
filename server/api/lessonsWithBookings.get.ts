export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const { tablesDB, Query } = useServerAppwrite()
    const config = useRuntimeConfig()
    const fromDate = new Date()

    const res = await tablesDB.listRows(
        config.public.database,
        'lessons',
        [
            Query.select(['*', 'bookings.*', 'bookings.students.*']),
            Query.orderAsc("date"),
            Query.greaterThanEqual("date", fromDate.toISOString()),
            Query.limit(100)
        ]
    )

    return Object.assign({}, res)
})
