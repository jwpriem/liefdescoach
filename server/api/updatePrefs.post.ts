import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { students } from '../database/schema'

export default defineEventHandler(async (event) => {
    const authUser = await requireAuth(event)
    const db = useDB()

    const body = await readBody(event)

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

    // Get current prefs from students table
    const existing = await db
        .select({ prefs: students.prefs })
        .from(students)
        .where(eq(students.id, body.userId))
        .limit(1)

    if (existing.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'Gebruiker niet gevonden' })
    }

    const currentPrefs = (existing[0].prefs as Record<string, any>) ?? {}
    const newPrefs = { ...currentPrefs, ...body.prefs }

    await db
        .update(students)
        .set({ prefs: newPrefs })
        .where(eq(students.id, body.userId))

    return { res: newPrefs }
})
