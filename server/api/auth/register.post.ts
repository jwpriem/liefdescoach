import { createError } from 'h3'
import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'
import { students } from '../../database/schema'

/**
 * POST /api/auth/register
 * Creates a new user account with email + password.
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body?.email || typeof body.email !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'E-mailadres is verplicht' })
    }
    if (!body?.password || typeof body.password !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Wachtwoord is verplicht' })
    }
    if (body.password.length < 8) {
        throw createError({ statusCode: 400, statusMessage: 'Wachtwoord moet minimaal 8 tekens zijn' })
    }
    if (!body?.name || typeof body.name !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Naam is verplicht' })
    }

    const email = body.email.trim().toLowerCase()
    const db = useDB()

    // Check if email already exists
    const existing = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.email, email))
        .limit(1)

    if (existing.length > 0) {
        throw createError({ statusCode: 409, statusMessage: 'Emailadres is al in gebruik, probeer in te loggen' })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(body.password, 12)

    // Create student
    const id = generateId()
    const studentData: any = {
        id,
        email,
        name: body.name,
        passwordHash,
    }

    if (body.dateOfBirth) {
        studentData.dateOfBirth = new Date(body.dateOfBirth)
    }
    if (body.phone) {
        studentData.phone = body.phone
    }

    await db.insert(students).values(studentData)

    // Create session
    await createSession(event, id)

    return {
        success: true,
        user: {
            $id: id,
            email,
            name: body.name,
            labels: [],
            emailVerification: false,
        },
    }
})
