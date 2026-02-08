/**
 * Creates the 'health' collection and migrates data from user prefs.
 *
 * Usage:
 *   yarn tsx scripts/setup-health-db.ts
 */

import { createAppwriteClient } from './appwrite-client'
import { RelationshipType, RelationMutate } from 'node-appwrite'

const POLL_INTERVAL_MS = 1000
const POLL_TIMEOUT_MS = 600000

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
            console.log(`Attribute "${key}" on "${collectionId}" status: ${attr.status}, waiting...`)
        } catch (e: any) {
            // ignore 404 while waiting
            if (e.status !== 404 && e.code !== 404) throw e
            console.log(`Waiting for attribute "${key}" on "${collectionId}" to be created...`)
        }
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
    }
    throw new Error(`Timeout waiting for attribute "${key}" on "${collectionId}"`)
}

async function main() {
    const { client, databases, users, ID } = createAppwriteClient()

    // We assume the database already exists and is configured in env
    const dbId = process.env.NUXT_PUBLIC_DATABASE
    if (!dbId) {
        throw new Error('NUXT_PUBLIC_DATABASE env var is required')
    }

    console.log(`Using database: ${dbId}`)

    // --- 1. Create 'health' collection if not exists ---
    let healthCollectionId = 'health'
    try {
        await databases.getCollection(dbId, healthCollectionId)
        console.log('"health" collection already exists.')
    } catch {
        console.log('Creating "health" collection...')
        await databases.createCollection(dbId, healthCollectionId, 'health')
    }

    // --- 2. Create attributes ---
    console.log('Creating attributes on "health"...')

    // We use a custom ID (studentId) for the document, so we don't strictly need a studentId attribute 
    // if we just rely on ID, but for relationships/querying it's safer to have it explicitly or use the relationship.
    // The user asked for a relation to the student.
    // Since 'students' collection exists (from setup-database.ts), we should link to it.

    // However, the user data is in the 'users' service (Auth) AND in 'students' collection (DB).
    // Usually we link to the 'students' collection document.

    await databases.createStringAttribute(dbId, 'health', 'injury', 1000, false)
    await databases.createBooleanAttribute(dbId, 'health', 'pregnancy', false)
    await databases.createDatetimeAttribute(dbId, 'health', 'dueDate', false)

    console.log('Waiting for attributes...')
    await Promise.all([
        waitForAttribute(databases, dbId, 'health', 'injury'),
        waitForAttribute(databases, dbId, 'health', 'pregnancy'),
        waitForAttribute(databases, dbId, 'health', 'dueDate'),
    ])

    // --- 3. Create Relationship to Students ---
    // health -> students (one-to-one? or many-to-one? A student has one health record)
    // Let's use OneToOne if possible, or OneToMany where Student has 1 Health.
    // Appwrite relationships are strictly between collections.

    console.log('Creating relationship: students <-> health...')
    // We want: Student has one Health record. Health belongs to one Student.
    // RelationshipType.OneToOne

    // We need to check if relationship already exists
    try {
        await databases.getAttribute(dbId, 'students', 'health')
        console.log('Relationship attribute on "students" found.')
    } catch {
        console.log('Creating relationship: students <-> health...')
        await databases.createRelationshipAttribute(
            dbId,
            'students',
            'health',
            RelationshipType.OneToOne,
            false, // twoWay - let's make it two-way so we can access health from student easily
            'health', // key on students
            'student', // key on health
            RelationMutate.Cascade // Deleting student deletes health record
        )
    }

    console.log('Waiting for relationship attributes to be ready (sequentially)...')
    // Wait for the primary relationship first
    console.log('Waiting for "students.health" attribute...')
    await waitForAttribute(databases, dbId, 'students', 'health')

    // Then wait for the back-reference (which might only appear after primary is ready)
    console.log('Waiting for "health.student" attribute...')
    await waitForAttribute(databases, dbId, 'health', 'student')

    console.log('Schema setup complete.')

    // --- 4. Migrate Data ---
    console.log('Starting migration from User Prefs...')

    let offset = 0
    let migratedCount = 0

    while (true) {
        const userList = await users.list([
            `limit(100)`,
            `offset(${offset})`
        ])

        const userRows = userList.users
        if (userRows.length === 0) break

        for (const user of userRows) {
            const prefs = user.prefs || {}
            const hasInjury = !!prefs.injury
            const hasPregnancy = !!prefs.pregnancy || !!prefs.pregnant // handle both keys just in case
            const dueDate = prefs.dueDate

            if (hasInjury || hasPregnancy || dueDate) {
                // Check if student record exists in DB (it should)
                try {
                    // We need the internal ID of the student document. 
                    // Usually user.$id === student.$id in this system (based on registerUser in store)

                    // Create or update health record
                    // Since it's 1-to-1 and we want to use the same ID if possible or let Appwrite handle it via relationship
                    // With 1-to-1, we usually set the student ID.

                    // Check if health record already exists for this student
                    // We can try to create it.

                    const healthData = {
                        injury: prefs.injury,
                        pregnancy: !!(prefs.pregnancy || prefs.pregnant),
                        dueDate: prefs.dueDate,
                        student: user.$id // Link to student
                    }

                    // Remove undefined/null values to avoid validation errors if they are optional? 
                    // createStringAttribute(..., false) means nullable? In Appwrite 'required=false' means nullable.
                    // But if we pass null explicitly to API it might be fine.

                    // Actually, let's create a new document ID or use ID.unique()
                    // But since we have a OneToOne constraint, we must ensure we don't create duplicates.

                    // Try to list health docs for this student? Or just create and catch error?
                    // Easier migration strategy: 
                    // 1. Try to create.

                    console.log(`Migrating data for ${user.name} (${user.$id})...`)
                    await databases.createDocument(
                        dbId,
                        'health',
                        ID.unique(),
                        healthData
                    )

                    // Clear prefs? Maybe keep them for backup for now.
                    migratedCount++

                } catch (e: any) {
                    // likely already exists or constraint violation
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
