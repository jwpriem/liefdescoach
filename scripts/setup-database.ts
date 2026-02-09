/**
 * Creates a new Appwrite database with the lessons/bookings/students schema.
 *
 * Usage:
 *   yarn tsx scripts/setup-database.ts                          # auto-generated ID
 *   yarn tsx scripts/setup-database.ts --name "My Test DB"      # custom name
 *
 * Required env vars: NUXT_PUBLIC_PROJECT, NUXT_APPWRITE_KEY
 * Output: prints the new database ID to set as NUXT_PUBLIC_DATABASE
 */

import { createAppwriteClient } from './appwrite-client'
import { RelationshipType, RelationMutate } from 'node-appwrite'

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
    const { databases, ID } = createAppwriteClient()

    const nameArg = process.argv.indexOf('--name')
    const dbName = nameArg !== -1 && process.argv[nameArg + 1]
        ? process.argv[nameArg + 1]
        : 'yoga-ravennah-test'

    // --- 1. Create database ---
    console.log(`Creating database "${dbName}"...`)
    const db = await databases.create(ID.unique(), dbName)
    const dbId = db.$id
    console.log(`Database created: ${dbId}`)

    // --- 2. Create collections ---
    console.log('Creating collections...')

    const lessons = await databases.createCollection(dbId, 'lessons', 'lessons')
    const bookings = await databases.createCollection(dbId, 'bookings', 'bookings')
    const students = await databases.createCollection(dbId, 'students', 'students')
    const credits = await databases.createCollection(dbId, 'credits', 'credits')

    console.log(`  - lessons  (${lessons.$id})`)
    console.log(`  - bookings (${bookings.$id})`)
    console.log(`  - students (${students.$id})`)
    console.log(`  - credits  (${credits.$id})`)

    // --- 3. Create attributes on lessons ---
    console.log('Creating attributes on "lessons"...')

    await databases.createDatetimeAttribute(dbId, 'lessons', 'date', true)
    await databases.createStringAttribute(dbId, 'lessons', 'type', 255, false)
    await databases.createStringAttribute(dbId, 'lessons', 'teacher', 255, false)

    // --- 4. Create attributes on students ---
    console.log('Creating attributes on "students"...')

    await databases.createStringAttribute(dbId, 'students', 'name', 255, true)
    await databases.createEmailAttribute(dbId, 'students', 'email', true)
    await databases.createDatetimeAttribute(dbId, 'students', 'dateOfBirth', false)
    await databases.createStringAttribute(dbId, 'students', 'phone', 50, false)

    // --- 5. Create attributes on credits ---
    console.log('Creating attributes on "credits"...')

    await databases.createStringAttribute(dbId, 'credits', 'studentId', 255, true)
    await databases.createStringAttribute(dbId, 'credits', 'bookingId', 255, false)
    await databases.createEnumAttribute(dbId, 'credits', 'type', ['credit_1', 'credit_5', 'credit_10'], true)
    await databases.createDatetimeAttribute(dbId, 'credits', 'validFrom', true)
    await databases.createDatetimeAttribute(dbId, 'credits', 'validTo', true)
    await databases.createDatetimeAttribute(dbId, 'credits', 'createdAt', true)
    await databases.createDatetimeAttribute(dbId, 'credits', 'usedAt', false)

    // --- 6. Wait for all plain attributes before creating relationships ---
    console.log('Waiting for attributes to be available...')

    await Promise.all([
        waitForAttribute(databases, dbId, 'lessons', 'date'),
        waitForAttribute(databases, dbId, 'lessons', 'type'),
        waitForAttribute(databases, dbId, 'lessons', 'teacher'),
        waitForAttribute(databases, dbId, 'students', 'name'),
        waitForAttribute(databases, dbId, 'students', 'email'),
        waitForAttribute(databases, dbId, 'students', 'dateOfBirth'),
        waitForAttribute(databases, dbId, 'students', 'phone'),
        waitForAttribute(databases, dbId, 'credits', 'studentId'),
        waitForAttribute(databases, dbId, 'credits', 'bookingId'),
        waitForAttribute(databases, dbId, 'credits', 'type'),
        waitForAttribute(databases, dbId, 'credits', 'validFrom'),
        waitForAttribute(databases, dbId, 'credits', 'validTo'),
        waitForAttribute(databases, dbId, 'credits', 'createdAt'),
        waitForAttribute(databases, dbId, 'credits', 'usedAt'),
    ])

    console.log('All plain attributes ready.')

    // --- 7. Create indexes on credits ---
    console.log('Creating indexes on "credits"...')
    await databases.createIndex(dbId, 'credits', 'idx_studentId', 'key', ['studentId'])
    await databases.createIndex(dbId, 'credits', 'idx_bookingId', 'key', ['bookingId'])
    await databases.createIndex(dbId, 'credits', 'idx_student_available', 'key', ['studentId', 'bookingId', 'validTo'])

    // --- 8. Create relationships ---
    // lessons -> bookings (one-to-many, cascade delete: deleting a lesson deletes its bookings)
    console.log('Creating relationship: lessons -> bookings...')
    await databases.createRelationshipAttribute(
        dbId,
        'lessons',         // parent collection
        'bookings',        // related collection
        RelationshipType.OneToMany,
        true,              // two-way: creates 'bookings' on lessons AND 'lessons' on bookings
        'bookings',        // key on lessons
        'lessons',         // key on bookings
        RelationMutate.Cascade
    )

    await waitForAttribute(databases, dbId, 'lessons', 'bookings')
    await waitForAttribute(databases, dbId, 'bookings', 'lessons')
    console.log('  - lessons.bookings <-> bookings.lessons ready')

    // students -> bookings (one-to-many, set-null: deleting a student nullifies the booking reference)
    console.log('Creating relationship: students -> bookings...')
    await databases.createRelationshipAttribute(
        dbId,
        'students',
        'bookings',
        RelationshipType.OneToMany,
        true,              // two-way: creates 'bookings' on students AND 'students' on bookings
        'bookings',        // key on students
        'students',        // key on bookings
        RelationMutate.SetNull
    )

    await waitForAttribute(databases, dbId, 'students', 'bookings')
    await waitForAttribute(databases, dbId, 'bookings', 'students')
    console.log('  - students.bookings <-> bookings.students ready')

    // --- Done ---
    console.log('\n========================================')
    console.log('Database setup complete!')
    console.log(`Database ID: ${dbId}`)
    console.log(`\nSet this in your environment:`)
    console.log(`  NUXT_PUBLIC_DATABASE=${dbId}`)
    console.log('========================================')
}

main().catch((err) => {
    console.error('Setup failed:', err.message ?? err)
    process.exit(1)
})
