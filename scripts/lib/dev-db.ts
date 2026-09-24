export const DEV_BRANCH = 'dev'

/** Environment for a command run against a Neon test branch: its database, without Neon API credentials. */
export function devCommandEnv(env: NodeJS.ProcessEnv, databaseUrl: string): NodeJS.ProcessEnv {
    const { NEON_API_KEY: _key, NEON_PROJECT_ID: _project, ...rest } = env
    return { ...rest, NUXT_DATABASE_URL: databaseUrl }
}
