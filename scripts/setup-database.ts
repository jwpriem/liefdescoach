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

const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 60000 // Increased timeout

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
            // Ignore not found errors while waiting, it might take a moment to appear in list
            if (e.code !== 404) console.warn(`Warning waiting for attribute ${key}: ${e.message}`)
        }
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
    }
    throw new Error(`Timeout waiting for attribute "${key}" on "${collectionId}"`)
}

async function createCollection(databases: any, dbId: string, name: string) {
    try {
        const col = await databases.createCollection(dbId, name, name)
        console.log(`  - ${name} (${col.$id}) [CREATED]`)
        return col
    } catch (e: any) {
        if (e.code === 409) {
            console.log(`  - ${name} [EXISTS]`)
            return { $id: name }
        }
        throw e
    }
}

async function createAttribute(
    databases: any,
    dbId: string,
    collId: string,
    key: string,
    createFn: () => Promise<any>
) {
    try {
        await createFn()
        console.log(`    + ${key} [CREATED]`)
    } catch (e: any) {
        if (e.code === 409) {
            console.log(`    + ${key} [EXISTS]`)
        } else {
            console.error(`    ! Failed to create ${key}: ${e.message}`)
            throw e
        }
    }
}

async function main() {
    console.log('--- Database Setup Script ---')
    const { databases, ID } = createAppwriteClient()

    const nameArg = process.argv.indexOf('--name')
    const dbName = nameArg !== -1 && process.argv[nameArg + 1]
        ? process.argv[nameArg + 1]
        : 'yoga-ravennah-test'

    // --- 1. Create database ---
    let dbId: string

    if (process.argv.includes('--use-existing') && process.env.NUXT_PUBLIC_DATABASE) {
        dbId = process.env.NUXT_PUBLIC_DATABASE
        console.log(`Using existing database: ${dbId}`)
    } else {
        console.log(`Creating database "${dbName}"...`)
        const db = await databases.create(ID.unique(), dbName)
        dbId = db.$id
        console.log(`Database created: ${dbId}`)
    }

    // --- 2. Create collections ---
    console.log('\n2. Creating collections...')

    await createCollection(databases, dbId, 'lessons')
    await createCollection(databases, dbId, 'bookings')
    await createCollection(databases, dbId, 'students')
    await createCollection(databases, dbId, 'credits')

    // --- 3. Create attributes on lessons ---
    console.log('\n3. Creating attributes on "lessons"...')

    await createAttribute(databases, dbId, 'lessons', 'date', () => databases.createDatetimeAttribute(dbId, 'lessons', 'date', true))
    await createAttribute(databases, dbId, 'lessons', 'type', () => databases.createStringAttribute(dbId, 'lessons', 'type', 255, false))
    await createAttribute(databases, dbId, 'lessons', 'teacher', () => databases.createStringAttribute(dbId, 'lessons', 'teacher', 255, false))

    // --- 4. Create attributes on students ---
    console.log('\n4. Creating attributes on "students"...')

    await createAttribute(databases, dbId, 'students', 'name', () => databases.createStringAttribute(dbId, 'students', 'name', 255, true))
    await createAttribute(databases, dbId, 'students', 'email', () => databases.createEmailAttribute(dbId, 'students', 'email', true))
    await createAttribute(databases, dbId, 'students', 'dateOfBirth', () => databases.createDatetimeAttribute(dbId, 'students', 'dateOfBirth', false))
    await createAttribute(databases, dbId, 'students', 'phone', () => databases.createStringAttribute(dbId, 'students', 'phone', 50, false))

    // --- 5. Create attributes on credits ---
    console.log('\n5. Creating attributes on "credits"...')

    await createAttribute(databases, dbId, 'credits', 'studentId', () => databases.createStringAttribute(dbId, 'credits', 'studentId', 255, true))
    await createAttribute(databases, dbId, 'credits', 'bookingId', () => databases.createStringAttribute(dbId, 'credits', 'bookingId', 255, false))
    await createAttribute(databases, dbId, 'credits', 'type', () => databases.createEnumAttribute(dbId, 'credits', 'type', ['credit_1', 'credit_5', 'credit_10'], true))
    await createAttribute(databases, dbId, 'credits', 'validFrom', () => databases.createDatetimeAttribute(dbId, 'credits', 'validFrom', true))
    await createAttribute(databases, dbId, 'credits', 'validTo', () => databases.createDatetimeAttribute(dbId, 'credits', 'validTo', true))
    await createAttribute(databases, dbId, 'credits', 'createdAt', () => databases.createDatetimeAttribute(dbId, 'credits', 'createdAt', true))
    await createAttribute(databases, dbId, 'credits', 'usedAt', () => databases.createDatetimeAttribute(dbId, 'credits', 'usedAt', false))

    // --- 6. Wait for all plain attributes before creating relationships ---
    console.log('\n6. Waiting for attributes to be available (sequential check to avoid rate limits)...')

    const attributesToWait = [
        { c: 'lessons', k: 'date' },
        { c: 'lessons', k: 'type' },
        { c: 'lessons', k: 'teacher' },
        { c: 'students', k: 'name' },
        { c: 'students', k: 'email' },
        { c: 'students', k: 'dateOfBirth' },
        { c: 'students', k: 'phone' },
        { c: 'credits', k: 'studentId' },
        { c: 'credits', k: 'bookingId' },
        { c: 'credits', k: 'type' },
        { c: 'credits', k: 'validFrom' },
        { c: 'credits', k: 'validTo' },
        { c: 'credits', k: 'createdAt' },
        { c: 'credits', k: 'usedAt' },
    ]

    for (const { c, k } of attributesToWait) {
        process.stdout.write(`  Waiting for ${c}.${k}... `)
        await waitForAttribute(databases, dbId, c, k)
        console.log('OK')
    }

    console.log('All plain attributes ready.')

    // --- 7. Create indexes on credits ---
    console.log('\n7. Creating indexes on "credits"...')
    const createIndex = async (coll: string, key: string, type: any, attrs: string[]) => {
        try {
            await databases.createIndex(dbId, coll, key, type, attrs)
            console.log(`    + Index ${key} [CREATED]`)
        } catch (e: any) {
            if (e.code === 409) console.log(`    + Index ${key} [EXISTS]`)
            else throw e
        }
    }

    await createIndex('credits', 'idx_studentId', 'key', ['studentId'])
    await createIndex('credits', 'idx_bookingId', 'key', ['bookingId'])
    await createIndex('credits', 'idx_student_available', 'key', ['studentId', 'bookingId', 'validTo'])

    // --- 8. Create relationships ---
    // lessons -> bookings (one-to-many, cascade delete: deleting a lesson deletes its bookings)
    console.log('\n8. Creating relationship: lessons -> bookings...')

    try {
        await databases.createRelationshipAttribute(
            dbId, 'lessons', 'bookings', RelationshipType.OneToMany, true, 'bookings', 'lessons', RelationMutate.Cascade
        )
        console.log('  Relationship created.')
    } catch (e: any) {
        if (e.code === 409) console.log('  Relationship exists.')
        else throw e
    }

    await waitForAttribute(databases, dbId, 'lessons', 'bookings')
    await waitForAttribute(databases, dbId, 'bookings', 'lessons')
    console.log('  - lessons.bookings <-> bookings.lessons ready')

    // students -> bookings (one-to-many, set-null: deleting a student nullifies the booking reference)
    console.log('Creating relationship: students -> bookings...')
    try {
        await databases.createRelationshipAttribute(
            dbId, 'students', 'bookings', RelationshipType.OneToMany, true, 'bookings', 'students', RelationMutate.SetNull
        )
        console.log('  Relationship created.')
    } catch (e: any) {
        if (e.code === 409) console.log('  Relationship exists.')
        else throw e
    }

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
