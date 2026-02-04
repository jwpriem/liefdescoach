import { createError } from 'h3'

export default defineEventHandler(async (event) => {
    const authUser = await requireAuth(event)
    const { users } = useServerAppwrite()

    const body = await readBody(event)

    // --- Input validation ---
    if (!body?.userId || typeof body.userId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'userId is verplicht' })
    }

    if (!body?.prefs || typeof body.prefs !== 'object') {
        throw createError({ statusCode: 400, statusMessage: 'prefs is verplicht' })
    }

    // Non-admins can only update their own prefs
    if (body.userId !== authUser.$id && !authUser.labels.includes('admin')) {
        throw createError({ statusCode: 403, statusMessage: 'Geen toegang' })
    }

    const current = await users.getPrefs(body.userId)
    const newPrefs = { ...current, ...body.prefs }
    const res = await users.updatePrefs(body.userId, newPrefs)

    return { res }
})
