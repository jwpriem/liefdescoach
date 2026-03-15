/**
 * One-time script: Sync archived status from Appwrite prefs to Neon.
 *
 * Usage: tsx --tsconfig scripts/tsconfig.json scripts/sync-archived-prefs.ts
 *
 * Requires env vars:
 *   - NUXT_DATABASE_URL (Neon connection string)
 *   - NUXT_PUBLIC_PROJECT (Appwrite project ID)
 *   - NUXT_APPWRITE_KEY (Appwrite server API key)
 */
import 'dotenv/config'
import { Users, Query } from 'node-appwrite'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import { createAppwriteClient } from './appwrite-client'
import { students } from '../server/database/schema'

const DATABASE_URL = process.env.NUXT_DATABASE_URL!
if (!DATABASE_URL) {
    console.error('Missing NUXT_DATABASE_URL')
    process.exit(1)
}

const { users } = createAppwriteClient()
const sql = neon(DATABASE_URL)
const db = drizzle(sql)

async function main() {
    console.log('🔍 Fetching Appwrite users and their prefs...\n')

    let offset = 0
    let archived = 0
    let skipped = 0
    let warnings = 0
    const knownKeys = new Set(['archive', 'reminders', 'credits'])

    while (true) {
        const batch = await users.list([Query.limit(100), Query.offset(offset)])
        if (batch.users.length === 0) break

        for (const user of batch.users) {
            try {
                const prefs = await users.getPrefs(user.$id)
                if (!prefs || Object.keys(prefs).length === 0) {
                    skipped++
                    continue
                }

                // Warn about unknown pref keys
                for (const key of Object.keys(prefs)) {
                    if (!knownKeys.has(key)) {
                        console.warn(`⚠️  Unknown pref "${key}" for ${user.email} (${user.$id}): ${JSON.stringify(prefs[key])}`)
                        warnings++
                    }
                }

                if (prefs.archive === true) {
                    await db
                        .update(students)
                        .set({ archived: true })
                        .where(eq(students.id, user.$id))
                    console.log(`  ✅ Archived: ${user.email}`)
                    archived++
                } else {
                    skipped++
                }
            } catch {
                skipped++
            }
        }

        offset += batch.users.length
        if (offset >= batch.total) break
    }

    console.log(`\n🎉 Done! ${archived} users archived, ${skipped} skipped, ${warnings} warnings`)
}

main().catch((err) => {
    console.error('❌ Failed:', err)
    process.exit(1)
})
