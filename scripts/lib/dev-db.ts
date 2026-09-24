export const DEV_BRANCH = 'dev'

/**
 * Environment for a command run against a Neon test branch: its database, without Neon API credentials.
 * The credentials are blanked, not deleted: nuxt/drizzle-kit reload .env and fill in any key that is
 * undefined, but never overwrite one that is set (even to '').
 */
export function devCommandEnv(env: NodeJS.ProcessEnv, databaseUrl: string): NodeJS.ProcessEnv {
    return { ...env, NUXT_DATABASE_URL: databaseUrl, NEON_API_KEY: '', NEON_PROJECT_ID: '' }
}

const NEW_DATABASE_FLAG = '--new-database'

/** Splits the wrapper's argv into our own flag and the command to run (the flag must not reach nuxt/drizzle-kit). */
export function parseWrapperArgs(argv: string[]): { newDatabase: boolean; command: string; args: string[] } {
    const newDatabase = argv.includes(NEW_DATABASE_FLAG)
    const [command, ...args] = argv.filter((arg) => arg !== NEW_DATABASE_FLAG)
    if (!command) throw new Error(`Usage: tsx scripts/with-dev-db.ts <command> [args...] [${NEW_DATABASE_FLAG}]`)
    return { newDatabase, command, args }
}
