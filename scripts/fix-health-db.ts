/**
 * Fixes the 'health' collection by resetting it and enabling two-way relationship.
 * Then re-migrates data from user prefs.
 *
 * Usage:
 *   yarn tsx scripts/fix-health-db.ts
 */

import { createAppwriteClient } from './appwrite-client'
import { RelationshipType, RelationMutate, Query } from 'node-appwrite'

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
        try {
            const attr = await databases.getAttribute(databaseId, collectionId, key)
            if (attr.status === 'available') return
            if (attr.status === 'failed') {
                throw new Error(`Attribute "${key}" on "${collectionId}" failed to create`)
            }
        } catch (e: any) {
            // ignore 404 while waiting
            if (e.code !== 404) throw e
        }
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
    }
    // throw new Error(`Timeout waiting for attribute "${key}" on "${collectionId}"`)
}

async function main() {
    const { client, databases, users, ID } = createAppwriteClient()

    const dbId = process.env.NUXT_PUBLIC_DATABASE
    if (!dbId) {
        throw new Error('NUXT_PUBLIC_DATABASE env var is required')
    }

    console.log(`Using database: ${dbId}`)

    // --- 1. Delete existing 'health' collection if exists ---
    // This will also delete the relationship on 'students' side because of cascade? 
    // Or we might need to delete the attribute on students manually.
    try {
        console.log('Deleting existing relationship on "students"...')
        await databases.deleteAttribute(dbId, 'students', 'health')
        // Wait for it to be gone?
        await new Promise(r => setTimeout(r, 2000))
    } catch (e) {
        console.log('Relationship might not exist or already deleted', e.message)
    }

    try {
        console.log('Deleting existing "health" collection...')
        await databases.deleteCollection(dbId, 'health')
        await new Promise(r => setTimeout(r, 2000))
    } catch (e) {
        console.log('"health" collection might not exist', e.message)
    }

    // --- 2. Re-create 'health' collection ---
    console.log('Creating "health" collection...')
    await databases.createCollection(dbId, 'health', 'health')

    // --- 3. Create attributes ---
    console.log('Creating attributes on "health"...')

    await databases.createStringAttribute(dbId, 'health', 'injury', 1000, false)
    await databases.createBooleanAttribute(dbId, 'health', 'pregnancy', false)
    await databases.createDatetimeAttribute(dbId, 'health', 'dueDate', false)

    console.log('Waiting for attributes...')
    await Promise.all([
        waitForAttribute(databases, dbId, 'health', 'injury'),
        waitForAttribute(databases, dbId, 'health', 'pregnancy'),
        waitForAttribute(databases, dbId, 'health', 'dueDate'),
    ])

    // --- 4. Create Relationship to Students (TWO-WAY) ---
    console.log('Creating relationship: students <-> health (TWO-WAY)...')

    await databases.createRelationshipAttribute(
        dbId,
        'students',
        'health',
        RelationshipType.OneToOne,
        true, // TWO-WAY: This allows health.student query
        'health', // key on students
        'student', // key on health
        RelationMutate.Cascade // Deleting student deletes health record
    )

    // Wait for BOTH attributes
    console.log('Waiting for relationship attributes...')
    await waitForAttribute(databases, dbId, 'students', 'health')
    await waitForAttribute(databases, dbId, 'health', 'student')

    console.log('Schema setup complete.')

    // --- 5. Migrate Data ---
    console.log('Starting migration from User Prefs...')

    let offset = 0
    let migratedCount = 0

    while (true) {
        const userList = await users.list([
            Query.limit(100),
            Query.offset(offset)
        ])

        const userRows = userList.users
        if (userRows.length === 0) break

        for (const user of userRows) {
            const prefs = user.prefs || {}
            const hasInjury = !!prefs.injury
            const hasPregnancy = !!prefs.pregnancy || !!prefs.pregnant
            const dueDate = prefs.dueDate

            if (hasInjury || hasPregnancy || dueDate) {
                try {
                    const healthData = {
                        injury: prefs.injury,
                        pregnancy: !!(prefs.pregnancy || prefs.pregnant),
                        dueDate: prefs.dueDate,
                        student: user.$id // Link to student
                    }

                    console.log(`Migrating data for ${user.name} (${user.$id})...`)
                    await databases.createDocument(
                        dbId,
                        'health',
                        ID.unique(),
                        healthData
                    )
                    migratedCount++

                } catch (e: any) {
                    console.log(`Skipping ${user.name}: ${e.message}`)
                }
            }
        }

        if (userRows.length < 100) break
        offset += 100
    }

    console.log(`Migration complete. Migrated ${migratedCount} records.`)
}

main().catch(console.error)
