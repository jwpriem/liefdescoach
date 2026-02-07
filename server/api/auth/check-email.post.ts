import { createError } from 'h3'

/**
 * Check whether a user with the given email exists.
 * Used by the OTP login flow to prevent auto-creation of new accounts.
 *
 * Body: { email: string }
 * Returns: { exists: true, userId: string } | { exists: false }
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body?.email || typeof body.email !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'E-mailadres is verplicht' })
    }

    const email = body.email.trim().toLowerCase()
    const { users, Query } = useServerAppwrite()

    const result = await users.list([Query.equal('email', [email])])

    if (result.total === 0) {
        return { exists: false }
    }

    return { exists: true, userId: result.users[0].$id }
})
