import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { health, students } from '../../database/schema'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { user: authUser, targetId, isOnBehalf } = await requireSelfOrAdmin(event, body?.userId)

    const { injury, pregnancy, dueDate } = body

    // Ensure student exists (self-healing)
    const studentRows = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.id, targetId))
        .limit(1)

    if (studentRows.length === 0) {
        // Self-healing: only create the record if the user is updating their own profile
        if (isOnBehalf) {
            throw createError({ statusCode: 404, statusMessage: 'Gebruiker niet gevonden' })
        }

        await db.insert(students).values({
            id: targetId,
            email: authUser.email,
            name: authUser.name,
        })
    }

    // Upsert health record
    const existing = await db
        .select({ id: health.id })
        .from(health)
        .where(eq(health.studentId, targetId))
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
                studentId: targetId,
                ...data,
            })
            .returning()
        result = inserted[0]
    }

    return { result }
})
