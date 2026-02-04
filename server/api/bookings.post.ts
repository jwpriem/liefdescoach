import { createError } from 'h3'

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)
    const { tablesDB, Query } = useServerAppwrite()
    const config = useRuntimeConfig()

    const body = await readBody(event)

    // Users can only fetch their own bookings (admins could fetch others)
    const targetUserId = body?.userId && typeof body.userId === 'string' && user.labels.includes('admin')
        ? body.userId
        : user.$id

    const res = await tablesDB.listRows(
        config.public.database,
        'bookings',
        [
            Query.equal('students', [targetUserId]),
            Query.select(['*', 'lessons.*']),
            Query.limit(100)
        ]
    )

    return Object.assign({}, res)
})
