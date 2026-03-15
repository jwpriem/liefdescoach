import { eq } from 'drizzle-orm'
import { students, userPrefs } from '../../database/schema'

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's data.
 */
export default defineEventHandler(async (event) => {
    const sessionUser = await getSessionUser(event)

    if (!sessionUser) {
        throw createError({ statusCode: 401, statusMessage: 'Niet ingelogd' })
    }

    const db = useDB()

    // Fetch user prefs
    const prefsRows = await db
        .select({ prefs: userPrefs.prefs })
        .from(userPrefs)
        .where(eq(userPrefs.userId, sessionUser.userId))
        .limit(1)

    const prefs = (prefsRows[0]?.prefs as Record<string, any>) ?? {}

    return {
        $id: sessionUser.userId,
        email: sessionUser.email,
        name: sessionUser.name,
        labels: sessionUser.isAdmin ? ['admin'] : [],
        emailVerification: sessionUser.emailVerified,
        prefs,
    }
})
