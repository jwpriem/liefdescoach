/**
 * Adds the credits collection to an EXISTING database.
 * Safe to run multiple times — skips if the collection already exists.
 *
 * Usage:
 *   npx tsx scripts/setup-credits-collection.ts
 *
 * Required env vars: NUXT_PUBLIC_PROJECT, NUXT_APPWRITE_KEY, NUXT_PUBLIC_DATABASE
 */

import { createAppwriteClient, getDatabaseId } from './appwrite-client'

const POLL_INTERVAL_MS = 1000
const POLL_TIMEOUT_MS = 30000

async function waitForAttribute(
    databases: any,
    databaseId: string,
    collectionId: string,
    key: string
) {
    const start = Date.now()
    while (Date.now() - start < POLL_TIMEOUT_MS) {
        const attr = await databases.getAttribute(databaseId, collectionId, key)
        if (attr.status === 'available') return
        if (attr.status === 'failed') {
            throw new Error(`Attribute "${key}" on "${collectionId}" failed to create`)
        }
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
    }
    throw new Error(`Timeout waiting for attribute "${key}" on "${collectionId}"`)
}

async function main() {
    const { databases } = createAppwriteClient()
    const dbId = getDatabaseId()

    console.log(`Database: ${dbId}`)

    // Check if credits collection already exists
    try {
        await databases.getCollection(dbId, 'credits')
        console.log('Credits collection already exists — nothing to do.')
        return
    } catch (e: any) {
        if (e?.code !== 404) throw e
        // 404 = doesn't exist yet, continue
    }

    // Create collection
    console.log('Creating credits collection...')
    await databases.createCollection(dbId, 'credits', 'credits')

    // Create attributes
    console.log('Creating attributes...')
    await databases.createStringAttribute(dbId, 'credits', 'studentId', 255, true)
    await databases.createStringAttribute(dbId, 'credits', 'bookingId', 255, false)
    await databases.createEnumAttribute(dbId, 'credits', 'type', ['credit_1', 'credit_5', 'credit_10', 'credit_legacy'], true)
    await databases.createDatetimeAttribute(dbId, 'credits', 'validFrom', true)
    await databases.createDatetimeAttribute(dbId, 'credits', 'validTo', true)
    await databases.createDatetimeAttribute(dbId, 'credits', 'createdAt', true)
    await databases.createDatetimeAttribute(dbId, 'credits', 'usedAt', false)

    // Wait for attributes
    console.log('Waiting for attributes to be available...')
    await Promise.all([
        waitForAttribute(databases, dbId, 'credits', 'studentId'),
        waitForAttribute(databases, dbId, 'credits', 'bookingId'),
        waitForAttribute(databases, dbId, 'credits', 'type'),
        waitForAttribute(databases, dbId, 'credits', 'validFrom'),
        waitForAttribute(databases, dbId, 'credits', 'validTo'),
        waitForAttribute(databases, dbId, 'credits', 'createdAt'),
        waitForAttribute(databases, dbId, 'credits', 'usedAt'),
    ])

    // Create indexes
    console.log('Creating indexes...')
    await databases.createIndex(dbId, 'credits', 'idx_studentId', 'key', ['studentId'])
    await databases.createIndex(dbId, 'credits', 'idx_bookingId', 'key', ['bookingId'])
    await databases.createIndex(dbId, 'credits', 'idx_student_available', 'key', ['studentId', 'bookingId', 'validTo'])

    console.log('\n========================================')
    console.log('Credits collection created successfully!')
    console.log('========================================')
}

main().catch((err) => {
    console.error('Setup failed:', err.message ?? err)
    process.exit(1)
})
