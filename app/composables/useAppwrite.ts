/**
 * Legacy Appwrite composable — no longer used.
 * All auth and database operations now go through server API routes.
 *
 * This file is kept temporarily for backwards compatibility.
 * It can be safely deleted once all references are confirmed removed.
 */
export function useAppwrite() {
    console.warn('useAppwrite() is deprecated — use server API routes instead')
    return {}
}
