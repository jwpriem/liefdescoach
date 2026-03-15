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

    // Non-admins can only update their own preferences
    if (body.userId !== authUser.$id && !authUser.labels.includes('admin')) {
        throw createError({ statusCode: 403, statusMessage: 'Geen toegang' })
    }

    const updates: Record<string, any> = {}

    if (typeof body.archived === 'boolean') {
        updates.archived = body.archived
    }
    if (typeof body.reminders === 'boolean') {
        updates.reminders = body.reminders
    }

    if (Object.keys(updates).length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'Geen geldige velden om bij te werken' })
    }

    await db
        .update(students)
        .set(updates)
        .where(eq(students.id, body.userId))

    return { ok: true }
})
