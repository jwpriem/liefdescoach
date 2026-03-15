/**
 * GET /api/auth/me
 * Returns the currently authenticated user's data.
 */
export default defineEventHandler(async (event) => {
    const sessionUser = await getSessionUser(event)

    if (!sessionUser) {
        throw createError({ statusCode: 401, statusMessage: 'Niet ingelogd' })
    }

    const prefs = (sessionUser.prefs as Record<string, any>) ?? {}

    return {
        $id: sessionUser.userId,
        email: sessionUser.email,
        name: sessionUser.name,
        labels: sessionUser.isAdmin ? ['admin'] : [],
        emailVerification: sessionUser.emailVerified,
        prefs,
    }
})
