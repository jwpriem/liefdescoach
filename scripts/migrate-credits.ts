/**
 * Migrates existing credits from Appwrite Auth user preferences to the new credits table.
 *
 * IDEMPOTENT: Checks if user already has credits in the table.
 * Safe to run multiple times. Skips archived users (prefs.archive === true).
 *
 * For each active user with prefs.credits > 0 (and no existing credits),
 * creates that many rows with type 'credit_1' and validTo set to 6 months from now.
 *
 * Usage:
 *   npx tsx scripts/migrate-credits.ts
 *
 * Required env vars: NUXT_PUBLIC_PROJECT, NUXT_APPWRITE_KEY, NUXT_PUBLIC_DATABASE
 */

import { createAppwriteClient, getDatabaseId } from './appwrite-client'
import { ID, Query } from 'node-appwrite'

async function main() {
    const { databases, users } = createAppwriteClient()
    const dbId = getDatabaseId()

    console.log('Starting credit migration...')
    console.log(`Database: ${dbId}`)

    // Fetch all users (paginate if needed)
    let allUsers: any[] = []
    let offset = 0
    const limit = 100
    while (true) {
        const res = await users.list([Query.limit(limit), Query.offset(offset)])
        allUsers = allUsers.concat(res.users)
        if (res.users.length < limit) break
        offset += limit
    }

    console.log(`Found ${allUsers.length} users`)

    const now = new Date()
    const validFrom = now.toISOString()
    const validTo = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate()).toISOString() // 6 months

    let totalMigrated = 0
    let totalSkipped = 0
    let totalArchived = 0

    for (const user of allUsers) {
        // Skip archived (inactive) users
        if (user.prefs?.archive === true) {
            console.log(`  ${user.name || user.email}: archived, skipping`)
            totalArchived++
            continue
        }

        const creditCount = parseInt(user.prefs?.credits ?? '0', 10)
        if (creditCount <= 0) {
            console.log(`  ${user.name || user.email}: 0 credits, skipping`)
            continue
        }

        // Idempotency check: does this user already have credits in the table?
        const existing = await databases.listDocuments(dbId, 'credits', [
            Query.equal('studentId', [user.$id]),
            Query.limit(1),
        ])

        if (existing.total > 0) {
            console.log(`  ${user.name || user.email}: already has credits in table, skipping`)
            totalSkipped++
            continue
        }

        console.log(`  ${user.name || user.email}: migrating ${creditCount} credits...`)

        for (let i = 0; i < creditCount; i++) {
            await databases.createDocument(dbId, 'credits', ID.unique(), {
                studentId: user.$id,
                bookingId: null,
                type: 'credit_1',
                validFrom,
                validTo,
                createdAt: now.toISOString(),
                usedAt: null,
            })
        }

        totalMigrated += creditCount
    }

    console.log('\n========================================')
    console.log(`Migration complete!`)
    console.log(`  Migrated: ${totalMigrated} credits`)
    console.log(`  Skipped:  ${totalSkipped} users (already have credits)`)
    console.log(`  Archived: ${totalArchived} users (inactive, skipped)`)
    console.log('========================================')
}

main().catch((err) => {
    console.error('Migration failed:', err.message ?? err)
    process.exit(1)
})
