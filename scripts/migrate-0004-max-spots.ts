/**
 * One-time migration: add max_spots column to lessons table.
 *
 * Usage: tsx --tsconfig scripts/tsconfig.json scripts/migrate-0004-max-spots.ts
 *
 * Requires env var: NUXT_DATABASE_URL
 */
import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.NUXT_DATABASE_URL!
if (!DATABASE_URL) {
    console.error('Missing NUXT_DATABASE_URL env var')
    process.exit(1)
}

const sql = neon(DATABASE_URL)

async function main() {
    console.log('=== Migration 0004: add max_spots to lessons ===\n')

    // Check if column already exists
    const check = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'lessons' AND column_name = 'max_spots'
    `

    if (check.length > 0) {
        console.log('Column max_spots already exists — skipping.')
        return
    }

    console.log('Applying: ALTER TABLE "lessons" ADD COLUMN "max_spots" integer DEFAULT 9 NOT NULL')
    await sql`ALTER TABLE "lessons" ADD COLUMN "max_spots" integer DEFAULT 9 NOT NULL`
    console.log('✓ Column added.\n')

    // Also update the drizzle migrations journal
    await sql`
        INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
        VALUES ('0004_add_lesson_max_spots', ${Date.now()})
        ON CONFLICT DO NOTHING
    `.catch(() => {
        // Journal table may not exist or have a different structure — ignore
    })

    console.log('Migration complete.')
}

main().catch((err) => {
    console.error('Migration failed:', err.message ?? err)
    process.exit(1)
})
