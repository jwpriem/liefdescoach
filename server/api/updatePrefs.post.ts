import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { userPrefs } from '../database/schema'

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

    // Get existing prefs
    const existing = await db
        .select()
        .from(userPrefs)
        .where(eq(userPrefs.userId, body.userId))
        .limit(1)

    let result
    if (existing.length > 0) {
        const currentPrefs = existing[0].prefs as Record<string, any>
        const newPrefs = { ...currentPrefs, ...body.prefs }
        const updated = await db
            .update(userPrefs)
            .set({ prefs: newPrefs })
            .where(eq(userPrefs.userId, body.userId))
            .returning()
        result = updated[0]
    } else {
        const inserted = await db
            .insert(userPrefs)
            .values({
                id: generateId(),
                userId: body.userId,
                prefs: body.prefs,
            })
            .returning()
        result = inserted[0]
    }

    return { res: result?.prefs ?? {} }
})
