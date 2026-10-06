import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../database/schema'

// Prerendering (nuxt generate, used for the iOS bundle) has no database; neon() only connects on a query
const sql = neon(import.meta.prerender ? 'postgresql://prerender:prerender@localhost/prerender' : process.env.NUXT_DATABASE_URL!)

export const db = drizzle(sql, { schema })
