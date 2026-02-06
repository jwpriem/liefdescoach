/**
 * Migrates existing credits from Appwrite Auth user preferences to the new credits table.
 *
 * IDEMPOTENT: Skips users who already have credit_legacy rows in the table.
 * Safe to run multiple times.
 *
 * For each user with prefs.credits > 0 (and no existing legacy credits),
 * creates that many rows with type 'credit_legacy' and validTo set to 1 year from now.
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
    const validTo = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year

    let totalMigrated = 0
    let totalSkipped = 0

    for (const user of allUsers) {
        const creditCount = parseInt(user.prefs?.credits ?? '0', 10)
        if (creditCount <= 0) {
            console.log(`  ${user.name || user.email}: 0 credits, skipping`)
            continue
        }

        // Idempotency check: does this user already have legacy credits?
        const existing = await databases.listDocuments(dbId, 'credits', [
            Query.equal('studentId', [user.$id]),
            Query.equal('type', ['credit_legacy']),
            Query.limit(1),
        ])

        if (existing.total > 0) {
            console.log(`  ${user.name || user.email}: already migrated (${existing.total} legacy credits exist), skipping`)
            totalSkipped++
            continue
        }

        console.log(`  ${user.name || user.email}: migrating ${creditCount} credits...`)

        for (let i = 0; i < creditCount; i++) {
            await databases.createDocument(dbId, 'credits', ID.unique(), {
                studentId: user.$id,
                bookingId: null,
                type: 'credit_legacy',
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
    console.log(`  Skipped:  ${totalSkipped} users (already migrated)`)
    console.log('========================================')
}

main().catch((err) => {
    console.error('Migration failed:', err.message ?? err)
    process.exit(1)
})
