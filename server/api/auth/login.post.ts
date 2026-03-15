import { createError } from 'h3'
import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'
import { students } from '../../database/schema'

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email + password.
 * Lazy password migration: if passwordHash is null, tries Appwrite Auth as fallback,
 * then stores the bcrypt hash in Neon for future logins.
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body?.email || typeof body.email !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'E-mailadres is verplicht' })
    }
    if (!body?.password || typeof body.password !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Wachtwoord is verplicht' })
    }

    const email = body.email.trim().toLowerCase()
    const password = body.password
    const db = useDB()

    // Look up student by email
    const rows = await db
        .select()
        .from(students)
        .where(eq(students.email, email))
        .limit(1)

    if (rows.length === 0) {
        throw createError({ statusCode: 401, statusMessage: 'Verkeerde e-mailadres of wachtwoord. Probeer opnieuw.' })
    }

    const student = rows[0]

    if (student.passwordHash) {
        // Password already migrated to Neon — verify directly
        const valid = await bcrypt.compare(password, student.passwordHash)
        if (!valid) {
            throw createError({ statusCode: 401, statusMessage: 'Verkeerde e-mailadres of wachtwoord. Probeer opnieuw.' })
        }
    } else {
        // Password not yet migrated — try Appwrite Auth as fallback
        const { Client, Account } = await import('node-appwrite')
        const config = useRuntimeConfig()

        const projectId = (config.public as any).project
        if (!projectId) {
            throw createError({ statusCode: 401, statusMessage: 'Verkeerde e-mailadres of wachtwoord. Probeer opnieuw.' })
        }

        const appwriteClient = new Client()
        appwriteClient.setEndpoint('https://cloud.appwrite.io/v1').setProject(projectId)
        const account = new Account(appwriteClient)

        // Verify against Appwrite — only catch auth failures here
        try {
            await account.createEmailPasswordSession(email, password)
        } catch (e: any) {
            console.error('[login] Appwrite fallback failed for', email, e?.message ?? e)
            throw createError({ statusCode: 401, statusMessage: 'Verkeerde e-mailadres of wachtwoord. Probeer opnieuw.' })
        }

        // Appwrite login succeeded — hash and store in Neon for future logins
        const hash = await bcrypt.hash(password, 12)
        await db
            .update(students)
            .set({ passwordHash: hash })
            .where(eq(students.id, student.id))

        // Clean up the Appwrite session (we don't need it)
        try { await account.deleteSession('current') } catch { /* ignore */ }
    }

    // Create session
    await createSession(event, student.id)

    return {
        success: true,
        user: {
            $id: student.id,
            email: student.email,
            name: student.name,
            labels: student.isAdmin ? ['admin'] : [],
            emailVerification: student.emailVerified,
        },
    }
})
