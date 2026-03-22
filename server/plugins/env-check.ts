/**
 * Validates that all required environment variables are set at server startup.
 * Throws immediately on startup if a critical variable is missing so the
 * issue is visible right away rather than causing silent runtime failures.
 */
export default defineNitroPlugin(() => {
    const required: string[] = [
        'NUXT_DATABASE_URL',
        'NUXT_SESSION_SECRET',
    ]

    const missing = required.filter((key) => !process.env[key])

    if (missing.length > 0) {
        throw new Error(
            `[startup] Missing required environment variables: ${missing.join(', ')}`
        )
    }
})
