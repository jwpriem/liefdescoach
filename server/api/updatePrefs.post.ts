import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { students } from '../database/schema'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { targetId } = await requireSelfOrAdmin(event, body?.userId)

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
        .where(eq(students.id, targetId))

    return { ok: true }
})
