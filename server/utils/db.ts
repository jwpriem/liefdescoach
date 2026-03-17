import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../database/schema'

const sql = neon(process.env.NUXT_DATABASE_URL!)

export const db = drizzle(sql, { schema })
