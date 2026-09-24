export const DEV_BRANCH = 'dev'

/**
 * Environment for a command run against a Neon test branch: its database, without Neon API credentials.
 * The credentials are blanked, not deleted: nuxt/drizzle-kit reload .env and fill in any key that is
 * undefined, but never overwrite one that is set (even to '').
 */
export function devCommandEnv(env: NodeJS.ProcessEnv, databaseUrl: string): NodeJS.ProcessEnv {
    return { ...env, NUXT_DATABASE_URL: databaseUrl, NEON_API_KEY: '', NEON_PROJECT_ID: '' }
}
