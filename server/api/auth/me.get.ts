/**
 * GET /api/auth/me
 * Returns the currently authenticated user's data.
 */
export default defineEventHandler(async (event) => {
    const sessionUser = await getSessionUser(event)

    if (!sessionUser) {
        throw createError({ statusCode: 401, statusMessage: 'Niet ingelogd' })
    }

    return {
        $id: sessionUser.userId,
        email: sessionUser.email,
        name: sessionUser.name,
        labels: sessionUser.isAdmin ? ['admin'] : [],
        emailVerification: sessionUser.emailVerified,
        archived: sessionUser.archived,
        reminders: sessionUser.reminders,
        pushNotifications: sessionUser.pushNotifications,
    }
})
