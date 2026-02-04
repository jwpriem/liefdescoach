export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const { users, Query } = useServerAppwrite()

    const res = await users.list(
        [
            Query.orderAsc("name"),
            Query.limit(100)
        ]
    )

    return Object.assign({}, res)
})
