/**
 * One-time script to add dateOfBirth column to the students collection.
 * 
 * Usage:
 *   yarn tsx scripts/add-dateofbirth-column.ts
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

    console.log('Adding dateOfBirth attribute to students collection...')

    // Check if attribute already exists
    try {
        const existing = await databases.getAttribute(dbId, 'students', 'dateOfBirth')
        if (existing) {
            console.log('Attribute "dateOfBirth" already exists on "students".')
            console.log(`Status: ${existing.status}`)
            return
        }
    } catch (e: any) {
        // 404 = attribute doesn't exist, which is what we expect
        if (e.code !== 404) {
            throw e
        }
    }

    // Create the attribute
    await databases.createDatetimeAttribute(dbId, 'students', 'dateOfBirth', false)
    console.log('Attribute creation initiated. Waiting for it to become available...')

    await waitForAttribute(databases, dbId, 'students', 'dateOfBirth')

    console.log('\n========================================')
    console.log('✓ dateOfBirth attribute added successfully!')
    console.log('========================================')
}

main().catch((err) => {
    console.error('Script failed:', err.message ?? err)
    process.exit(1)
})
