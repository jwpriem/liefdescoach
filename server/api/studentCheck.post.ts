import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { students } from '../database/schema'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const db = useDB()

    const body = await readBody(event)

    if (!body?.email || typeof body.email !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'E-mail is verplicht' })
    }

    const rows = await db
        .select()
        .from(students)
        .where(eq(students.email, body.email))

    return {
        rows: rows.map(r => ({
            $id: r.id,
            name: r.name,
            email: r.email,
            phone: r.phone,
            dateOfBirth: r.dateOfBirth?.toISOString() ?? null,
        })),
        total: rows.length,
    }
})
