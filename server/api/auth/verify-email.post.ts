import { eq } from 'drizzle-orm'
import { students } from '../../database/schema'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const config = useRuntimeConfig()

    const payload = verifySignedToken(body?.token, config.sessionSecret, 'email-verification')

    // Update email verification in Neon
    await db
        .update(students)
        .set({ emailVerified: true })
        .where(eq(students.id, payload.userId))

    return { success: true }
})
