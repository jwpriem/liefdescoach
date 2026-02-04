/**
 * Syncs all users from Appwrite Auth into the students collection.
 * Uses the Auth user's $id as the student document ID so they stay linked.
 * Existing students are skipped (upsert by checking existence first).
 *
 * Usage:
 *   npx tsx scripts/sync-students.ts
 *
 * Required env vars: NUXT_PUBLIC_PROJECT, NUXT_APPWRITE_KEY, NUXT_PUBLIC_DATABASE
 */

import { createAppwriteClient, getDatabaseId } from './appwrite-client'

async function main() {
    const { databases, users, Query } = createAppwriteClient()
    const dbId = getDatabaseId()

    console.log('Fetching users from Auth...')

    let offset = 0
    const limit = 100
    let totalSynced = 0
    let totalSkipped = 0

    while (true) {
        const batch = await users.list([
            Query.limit(limit),
            Query.offset(offset),
        ])

        if (batch.users.length === 0) break

        for (const user of batch.users) {
            // Skip users without email (shouldn't happen, but be safe)
            if (!user.email) {
                console.log(`  SKIP (no email): ${user.$id}`)
                totalSkipped++
                continue
            }

            // Check if student document already exists
            try {
                await databases.getDocument(dbId, 'students', user.$id)
                console.log(`  EXISTS: ${user.name || user.email} (${user.$id})`)
                totalSkipped++
                continue
            } catch {
                // Document doesn't exist — create it
            }

            await databases.createDocument(dbId, 'students', user.$id, {
                name: user.name || user.email.split('@')[0],
                email: user.email,
            })

            console.log(`  SYNCED: ${user.name || user.email} (${user.$id})`)
            totalSynced++
        }

        if (batch.users.length < limit) break
        offset += limit
    }

    console.log(`\nDone! Synced: ${totalSynced}, Skipped: ${totalSkipped}`)
}

main().catch((err) => {
    console.error('Sync failed:', err.message ?? err)
    process.exit(1)
})
