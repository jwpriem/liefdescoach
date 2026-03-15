import { eq } from 'drizzle-orm'
import { health, students } from '../../database/schema'

export default defineEventHandler(async (event) => {
    const authUser = await requireAuth(event)
    const db = useDB()

    let healthData = null
    let dateOfBirth = null
    let phone = null

    // Fetch health data
    const healthRows = await db
        .select()
        .from(health)
        .where(eq(health.studentId, authUser.$id))
        .limit(1)

    if (healthRows.length > 0) {
        const h = healthRows[0]
        healthData = {
            $id: h.id,
            injury: h.injury,
            pregnancy: h.pregnancy,
            dueDate: h.dueDate?.toISOString() ?? null,
        }
    }

    // Fetch student profile data
    const studentRows = await db
        .select({ dateOfBirth: students.dateOfBirth, phone: students.phone })
        .from(students)
        .where(eq(students.id, authUser.$id))
        .limit(1)

    if (studentRows.length > 0) {
        dateOfBirth = studentRows[0].dateOfBirth?.toISOString() ?? null
        phone = studentRows[0].phone ?? null
    }

    return { health: healthData, dateOfBirth, phone }
})
