/**
 * Adds the otp_codes collection to an EXISTING database.
 * Safe to run multiple times — skips if the collection already exists.
 *
 * Usage:
 *   yarn tsx scripts/setup-otp-collection.ts
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

    // Check if otp_codes collection already exists
    try {
        await databases.getCollection(dbId, 'otp_codes')
        console.log('otp_codes collection already exists — nothing to do.')
        return
    } catch (e: any) {
        if (e?.code !== 404) throw e
        // 404 = doesn't exist yet, continue
    }

    // Create collection
    console.log('Creating otp_codes collection...')
    await databases.createCollection(dbId, 'otp_codes', 'otp_codes')

    // Create attributes
    console.log('Creating attributes...')
    await databases.createStringAttribute(dbId, 'otp_codes', 'email', 255, true)
    await databases.createStringAttribute(dbId, 'otp_codes', 'code', 6, true)
    await databases.createStringAttribute(dbId, 'otp_codes', 'userId', 255, true)
    await databases.createDatetimeAttribute(dbId, 'otp_codes', 'expiresAt', true)

    // Wait for attributes
    console.log('Waiting for attributes to be available...')
    await Promise.all([
        waitForAttribute(databases, dbId, 'otp_codes', 'email'),
        waitForAttribute(databases, dbId, 'otp_codes', 'code'),
        waitForAttribute(databases, dbId, 'otp_codes', 'userId'),
        waitForAttribute(databases, dbId, 'otp_codes', 'expiresAt'),
    ])

    // Create indexes
    console.log('Creating indexes...')
    await databases.createIndex(dbId, 'otp_codes', 'idx_email', 'key', ['email'])

    console.log('\n========================================')
    console.log('otp_codes collection created successfully!')
    console.log('========================================')
}

main().catch((err) => {
    console.error('Setup failed:', err.message ?? err)
    process.exit(1)
})
