/**
 * Adds the otp_codes table to an EXISTING database using the TablesDB API.
 * Safe to run multiple times — skips if the table already exists.
 *
 * Usage:
 *   yarn db:setup-otp
 *
 * Required env vars: NUXT_PUBLIC_PROJECT, NUXT_APPWRITE_KEY, NUXT_PUBLIC_DATABASE
 */

import { IndexType } from 'node-appwrite'
import { createAppwriteClient, getDatabaseId } from './appwrite-client'

const POLL_INTERVAL_MS = 1000
const POLL_TIMEOUT_MS = 30000

async function waitForColumn(
    tablesDB: any,
    databaseId: string,
    tableId: string,
    key: string
) {
    const start = Date.now()
    while (Date.now() - start < POLL_TIMEOUT_MS) {
        const col = await tablesDB.getColumn(databaseId, tableId, key)
        if (col.status === 'available') return
        if (col.status === 'failed') {
            throw new Error(`Column "${key}" on "${tableId}" failed to create`)
        }
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
    }
    throw new Error(`Timeout waiting for column "${key}" on "${tableId}"`)
}

async function main() {
    const { tablesDB } = createAppwriteClient()
    const dbId = getDatabaseId()

    console.log(`Database: ${dbId}`)

    // Check if otp_codes table already exists
    try {
        await tablesDB.getTable(dbId, 'otp_codes')
        console.log('otp_codes table already exists — nothing to do.')
        return
    } catch (e: any) {
        if (e?.code !== 404) throw e
        // 404 = doesn't exist yet, continue
    }

    // Create table
    console.log('Creating otp_codes table...')
    await tablesDB.createTable(dbId, 'otp_codes', 'otp_codes')

    // Create columns
    console.log('Creating columns...')
    await tablesDB.createStringColumn(dbId, 'otp_codes', 'email', 255, true)
    await tablesDB.createStringColumn(dbId, 'otp_codes', 'code', 6, true)
    await tablesDB.createStringColumn(dbId, 'otp_codes', 'userId', 255, true)
    await tablesDB.createDatetimeColumn(dbId, 'otp_codes', 'expiresAt', true)

    // Wait for columns to become available
    console.log('Waiting for columns to be available...')
    await Promise.all([
        waitForColumn(tablesDB, dbId, 'otp_codes', 'email'),
        waitForColumn(tablesDB, dbId, 'otp_codes', 'code'),
        waitForColumn(tablesDB, dbId, 'otp_codes', 'userId'),
        waitForColumn(tablesDB, dbId, 'otp_codes', 'expiresAt'),
    ])

    // Create index on email for lookups
    console.log('Creating indexes...')
    await tablesDB.createIndex(dbId, 'otp_codes', 'idx_email', IndexType.Key, ['email'])

    console.log('\n========================================')
    console.log('otp_codes table created successfully!')
    console.log('========================================')
}

main().catch((err) => {
    console.error('Setup failed:', err.message ?? err)
    process.exit(1)
})
