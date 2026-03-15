import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { health, students } from '../../database/schema'

export default defineEventHandler(async (event) => {
    const authUser = await requireAuth(event)
    const db = useDB()

    const body = await readBody(event)

    if (!body?.userId || typeof body.userId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'userId is verplicht' })
    }

    if (body.userId !== authUser.$id && !authUser.labels.includes('admin')) {
        throw createError({ statusCode: 403, statusMessage: 'Geen toegang' })
    }

    const { injury, pregnancy, dueDate } = body

    // Ensure student exists (self-healing)
    const studentRows = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.id, body.userId))
        .limit(1)

    if (studentRows.length === 0) {
        await db.insert(students).values({
            id: body.userId,
            email: authUser.email,
            name: authUser.name,
        })
    }

    // Upsert health record
    const existing = await db
        .select({ id: health.id })
        .from(health)
        .where(eq(health.studentId, body.userId))
        .limit(1)

    const data = {
        injury: injury ?? null,
        pregnancy: pregnancy ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
    }

    let result
    if (existing.length > 0) {
        const updated = await db
            .update(health)
            .set(data)
            .where(eq(health.id, existing[0].id))
            .returning()
        result = updated[0]
    } else {
        const inserted = await db
            .insert(health)
            .values({
                id: generateId(),
                studentId: body.userId,
                ...data,
            })
            .returning()
        result = inserted[0]
    }

    return { result }
})
