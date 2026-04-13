import { eq } from 'drizzle-orm'
import { health, students } from '../../database/schema'

export default defineEventHandler(async (event) => {
    const authUser = await requireAuth(event)

    let healthData = null
    let dateOfBirth = null
    let phone = null

    // Fetch health and student profile data concurrently
    const [healthRows, studentRows] = await Promise.all([
        db
            .select()
            .from(health)
            .where(eq(health.studentId, authUser.$id))
            .limit(1),
        db
            .select({ dateOfBirth: students.dateOfBirth, phone: students.phone, phoneRequested: students.phoneRequested })
            .from(students)
            .where(eq(students.id, authUser.$id))
            .limit(1)
    ])

    if (healthRows.length > 0) {
        const h = healthRows[0]
        healthData = {
            $id: h.id,
            injury: h.injury,
            pregnancy: h.pregnancy,
            dueDate: h.dueDate?.toISOString() ?? null,
        }
    }

    let phoneRequested = false

    if (studentRows.length > 0) {
        dateOfBirth = studentRows[0].dateOfBirth?.toISOString() ?? null
        phone = studentRows[0].phone ?? null
        phoneRequested = studentRows[0].phoneRequested ?? false
    }

    return { health: healthData, dateOfBirth, phone, phoneRequested }
})
