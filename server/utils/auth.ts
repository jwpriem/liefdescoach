import { H3Event, createError } from 'h3'

export interface AuthenticatedUser {
    $id: string
    email: string
    name: string
    labels: string[]
}

/**
 * Verifies the user's session from the request cookies.
 * Returns the authenticated user or throws a 401 error.
 */
export async function requireAuth(event: H3Event): Promise<AuthenticatedUser> {
    const sessionUser = await getSessionUser(event)

    if (!sessionUser) {
        throw createError({ statusCode: 401, statusMessage: 'Niet ingelogd' })
    }

    return {
        $id: sessionUser.userId,
        email: sessionUser.email,
        name: sessionUser.name,
        labels: sessionUser.isAdmin ? ['admin'] : [],
    }
}

/**
 * Verifies the user is authenticated AND has the 'admin' label.
 * Throws 403 if not an admin.
 */
export async function requireAdmin(event: H3Event): Promise<AuthenticatedUser> {
    const user = await requireAuth(event)

    if (!user.labels.includes('admin')) {
        throw createError({ statusCode: 403, statusMessage: 'Geen toegang' })
    }

    return user
}
