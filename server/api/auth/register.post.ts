import { createError, getRequestIP } from 'h3'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { students } from '../../database/schema'

const MAX_REGISTRATIONS_PER_IP = 5;
const REGISTRATION_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const registrationsByIP = new Map<string, { count: number; firstRequest: number }>();
let lastCleanup = 0;

function lazyCleanup(now: number) {
    if (registrationsByIP.size > 1000 && now - lastCleanup > 60000) {
        lastCleanup = now;
        for (const [key, data] of registrationsByIP.entries()) {
            if (now - data.firstRequest > REGISTRATION_WINDOW_MS) {
                registrationsByIP.delete(key);
            }
        }
    }
}

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
    if (body.name.trim().length < 2 || body.name.trim().length > 100) {
        throw createError({ statusCode: 400, statusMessage: 'Naam moet tussen 2 en 100 tekens zijn' })
    }
    if (body.phone && (typeof body.phone !== 'string' || !/^\+?[\d\s\-()]{7,20}$/.test(body.phone.trim()))) {
        throw createError({ statusCode: 400, statusMessage: 'Ongeldig telefoonnummer' })
    }

    const email = body.email.trim().toLowerCase()

    const ip = getRequestIP(event) || 'unknown';
    const now = Date.now();

    lazyCleanup(now);

    const ipData = registrationsByIP.get(ip);

    if (ipData) {
        if (now - ipData.firstRequest > REGISTRATION_WINDOW_MS) {
            // Reset window
            registrationsByIP.set(ip, { count: 1, firstRequest: now });
        } else if (ipData.count >= MAX_REGISTRATIONS_PER_IP) {
            throw createError({ statusCode: 429, statusMessage: 'Te veel registraties vanaf dit IP. Probeer het later opnieuw.' })
        } else {
            ipData.count++;
        }
    } else {
        registrationsByIP.set(ip, { count: 1, firstRequest: now });
    }

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
