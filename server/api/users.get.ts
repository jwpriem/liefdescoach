import { asc, eq } from 'drizzle-orm'
import { students, health } from '../database/schema'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const db = useDB()

    // Fetch all students with optional health data
    const rows = await db
        .select({
            id: students.id,
            name: students.name,
            email: students.email,
            phone: students.phone,
            dateOfBirth: students.dateOfBirth,
            isAdmin: students.isAdmin,
            emailVerified: students.emailVerified,
            createdAt: students.createdAt,
            healthId: health.id,
            injury: health.injury,
            pregnancy: health.pregnancy,
            dueDate: health.dueDate,
        })
        .from(students)
        .leftJoin(health, eq(students.id, health.studentId))
        .orderBy(asc(students.name))
        .limit(100)

    const users = rows.map((r) => ({
        $id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        dateOfBirth: r.dateOfBirth?.toISOString() ?? null,
        labels: r.isAdmin ? ['admin'] : [],
        emailVerification: r.emailVerified,
        registration: r.createdAt?.toISOString() ?? null,
        health: r.healthId ? {
            $id: r.healthId,
            injury: r.injury,
            pregnancy: r.pregnancy,
            dueDate: r.dueDate?.toISOString() ?? null,
        } : null,
    }))

    return { users, total: users.length }
})
