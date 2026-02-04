import { H3Event, createError } from 'h3'
import { Client, Account } from 'node-appwrite'

interface AuthenticatedUser {
    $id: string
    email: string
    name: string
    labels: string[]
}

/**
 * Verifies the user's Appwrite session from the request cookies.
 * Returns the authenticated user or throws a 401 error.
 */
export async function requireAuth(event: H3Event): Promise<AuthenticatedUser> {
    const sessionCookie = getCookie(event, 'a_session_' + useRuntimeConfig().public.project)
        ?? event.headers.get('x-appwrite-session')

    if (!sessionCookie) {
        throw createError({ statusCode: 401, statusMessage: 'Niet ingelogd' })
    }

    try {
        const config = useRuntimeConfig()
        const client = new Client()
        client
            .setEndpoint('https://cloud.appwrite.io/v1')
            .setProject(config.public.project)
            .setSession(sessionCookie)

        const account = new Account(client)
        const user = await account.get()

        return {
            $id: user.$id,
            email: user.email,
            name: user.name,
            labels: user.labels ?? [],
        }
    } catch {
        throw createError({ statusCode: 401, statusMessage: 'Ongeldige sessie' })
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
