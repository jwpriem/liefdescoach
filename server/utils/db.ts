import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../database/schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function useDB() {
  if (!_db) {
    const sql = neon(useRuntimeConfig().databaseUrl)
    _db = drizzle(sql, { schema })
  }
  return _db
}
