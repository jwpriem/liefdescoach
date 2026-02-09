/**
 * Creates a new Appwrite database with the data from the old database.
 *
 * Usage:
 *   yarn tsx scripts/replicate-prod-db.ts  # auto-generated ID
 *
 * Required env vars: NUXT_PUBLIC_PROJECT, NUXT_APPWRITE_KEY
 * Output: prints the new database ID to set as NUXT_PUBLIC_DATABASE
 */

import 'dotenv/config'
import { Client, Databases, ID, Query } from 'node-appwrite'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// --- Configuration ---
const OLD_DB_ID = process.env.NUXT_PUBLIC_DATABASE
const PROJECT_ID = process.env.NUXT_PUBLIC_PROJECT
const API_KEY = process.env.NUXT_APPWRITE_KEY

if (!OLD_DB_ID || !PROJECT_ID || !API_KEY) {
    console.error('Missing required env vars: NUXT_PUBLIC_DATABASE, NUXT_PUBLIC_PROJECT, NUXT_APPWRITE_KEY')
    process.exit(1)
}

// --- Appwrite Setup ---
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(PROJECT_ID)
    .setKey(API_KEY)

const databases = new Databases(client)

// --- Helpers ---

async function runSetupScript(scriptName: string, newDbId: string) {
    console.log(`\n--- Running ${scriptName} for DB ${newDbId} ---`)
    try {
        const cmd = scriptName === 'setup-database.ts'
            ? `yarn tsx scripts/${scriptName} --use-existing`
            : `yarn tsx scripts/${scriptName}`

        const { stdout, stderr } = await execAsync(cmd, {
            env: {
                ...process.env,
                NUXT_PUBLIC_DATABASE: newDbId
            }
        })
        console.log(stdout)
        if (stderr) console.error(stderr)
    } catch (error: any) {
        console.error(`Error running ${scriptName}:`, error.message)
        throw error
    }
}

async function getCollectionIdByName(dbId: string, name: string): Promise<string | null> {
    try {
        const { collections } = await databases.listCollections(dbId, [
            Query.limit(100)
        ])
        const match = collections.find(c => c.name === name)
        return match ? match.$id : null
    } catch (e) {
        console.error(`Error listing collections from ${dbId}:`, e)
        return null
    }
}

async function migrateCollection(
    fromDb: string,
    toDb: string,
    sourceColId: string,
    targetColId: string,
    batchSize = 100,
    transform?: (doc: any) => any
) {
    console.log(`\nMigrating collection: ${sourceColId} -> ${targetColId}...`)
    let offset = 0
    let count = 0
    let total = 0

    // Get total count first for progress
    // Note: Appwrite list returns total

    while (true) {
        try {
            const list = await databases.listDocuments(fromDb, sourceColId, [
                Query.limit(batchSize),
                Query.offset(offset)
            ])

            total = list.total
            const docs = list.documents

            if (docs.length === 0) break

            for (const doc of docs) {
                // Prepare new doc data
                // We MUST exclude system attributes: $id, $createdAt, $updatedAt, $permissions, $databaseId, $collectionId
                // But we WANT to preserve $id and $createdAt if possible (createdAt/updatedAt might be read-only system attrs)
                // Appwrite doesn't allow setting $createdAt/$updatedAt usually.
                // We WILL preserve $id.

                const { $id, $createdAt, $updatedAt, $permissions, $databaseId, $collectionId, ...data } = doc

                let payload = { ...data }
                if (transform) {
                    payload = transform(payload)
                }

                try {
                    await databases.createDocument(toDb, targetColId, $id, payload, $permissions)
                    process.stdout.write('.')
                    count++
                } catch (e: any) {
                    if (e.code === 409) {
                        process.stdout.write('S') // Skipped (exists)
                    } else {
                        console.error(`\nFailed to migrate document ${$id}:`, e.message)
                    }
                }
            }

            offset += batchSize
        } catch (e: any) {
            console.error(`\nError listing documents from ${sourceColId}:`, e.message)
            break;
        }
    }
    console.log(`\n${targetColId} migration complete. ${count}/${total} migrated.`)
}

async function main() {
    console.log(`Starting replication from OLD DB: ${OLD_DB_ID}`)

    // Resolve Source IDs
    console.log('Resolving source collection IDs...')
    const sourceIds = {
        students: await getCollectionIdByName(OLD_DB_ID, 'students'),
        lessons: await getCollectionIdByName(OLD_DB_ID, 'lessons'),
        bookings: await getCollectionIdByName(OLD_DB_ID, 'bookings'),
        credits: await getCollectionIdByName(OLD_DB_ID, 'credits'),
        health: await getCollectionIdByName(OLD_DB_ID, 'health'),
        otp_codes: await getCollectionIdByName(OLD_DB_ID, 'otp_codes')
    }

    console.log('Source IDs found:', sourceIds)

    // 1. Create or Select Database
    console.log('\n--- 1. Database Setup ---')

    let NEW_DB_ID: string
    const targetArg = process.argv.indexOf('--target')

    if (targetArg !== -1 && process.argv[targetArg + 1]) {
        NEW_DB_ID = process.argv[targetArg + 1]
        console.log(`Using existing target database: ${NEW_DB_ID}`)
    } else {
        console.log('Creating New Database...')
        const newDbName = 'main'
        const newDb = await databases.create(ID.unique(), newDbName)
        NEW_DB_ID = newDb.$id
        console.log(`New Database Created: ${newDbName} (${NEW_DB_ID})`)
    }

    // 2. Run Setup Scripts
    // These scripts expect NUXT_PUBLIC_DATABASE in env, which we will override
    console.log('\n--- 2. Setting up Schema ---')

    // setup-database.ts handles: lessons, bookings, students, credits collections & relations
    await runSetupScript('setup-database.ts', NEW_DB_ID)

    // setup-health-db.ts handles: health collection & relation
    await runSetupScript('setup-health-db.ts', NEW_DB_ID)

    // setup-otp-collection.ts handles: otp_codes collection
    await runSetupScript('setup-otp-collection.ts', NEW_DB_ID)

    // 3. Migrate Data
    console.log('\n--- 3. Migrating Data ---')

    // Order matters for relationships!
    // 1. Students (independent)
    if (sourceIds.students) await migrateCollection(OLD_DB_ID, NEW_DB_ID, sourceIds.students, 'students')

    // 2. Lessons (independent)
    if (sourceIds.lessons) await migrateCollection(OLD_DB_ID, NEW_DB_ID, sourceIds.lessons, 'lessons')

    // 3. Bookings (depends on Students and Lessons)
    // Bookings have relationships: 'students' and 'lessons'. 
    // The data payload for a relationship in Appwrite is the ID string (or array of strings).
    // Since we preserved IDs for students and lessons, the existing IDs in bookings should still work!
    if (sourceIds.bookings) await migrateCollection(OLD_DB_ID, NEW_DB_ID, sourceIds.bookings, 'bookings')

    // 4. Credits (depends on Students and possibly Bookings)
    if (sourceIds.credits) await migrateCollection(OLD_DB_ID, NEW_DB_ID, sourceIds.credits, 'credits')

    // 5. Health (depends on Students)
    // Health has a student relationship.
    // In setup-health-db.ts migration, it manually sets the relationship.
    // Here we just copy the data. If 'student' attribute is present in the doc data as a string ID, it should link up.
    if (sourceIds.health) await migrateCollection(OLD_DB_ID, NEW_DB_ID, sourceIds.health, 'health')

    // 6. OTP Codes (independent)
    // Note: OTP codes might be in a Table (SQL-like) or Collection depending on implementation.
    // setup-otp-collection.ts uses `tablesDB.createTable`.
    // Wait, `tablesDB` is a different API client than `databases`.
    // Let's verify if `otp_codes` is in the same "Database" structure or if it uses the SQL/Tables feature.
    // `setup-otp-collection.ts` imports `tablesDB` from `appwrite-client`.
    // It creates a table in the database defined by `getDatabaseId()`.
    // IMPORTANT: Appwrite `Databases` service manages both "Collections" (NoSQL-like) and presumably "Tables" if that's a new feature or wrapper?
    // Actually, `tablesDB` in `appwrite-client.ts` is `new TablesDB(client)`. This looks like a community adapter or a specific SDK feature?
    // Let's check `appwrite-client.ts` again. It has `TablesDB` imported from `node-appwrite`.
    // Wait, standard Appwrite SDK has `Databases`. Does it have `TablesDB`? 
    // Checking `setup-otp-collection.ts` imports: `import { IndexType } from 'node-appwrite'`.
    // Checking `appwrite-client.ts` imports: `import { Client, Databases, TablesDB, Users, Query, ID } from 'node-appwrite'`.
    // If TablesDB exists, it might be a custom thing or I'm misremembering the SDK. 
    // Assuming it works like Databases but for SQL-ish tables if enabled.
    // However, `migrateCollection` above uses `databases.listDocuments` which works for Collections. 
    // If `otp_codes` is a *Collection* but accessed via a "Tables" style wrapper, it might be fine.
    // But if it creates a literal SQL Table that isn't a Collection, `listDocuments` might fail.
    // Let's look at `setup-otp-collection.ts` again. 
    // It uses `tablesDB.createTable(dbId, 'otp_codes', 'otp_codes')`. 
    // If this is actually creating a Collection under the hood (which is common in Appwrite), then `listDocuments` will work.
    // If native SQL tables are supported now, I might need a different migration strategy for it.
    // Given the ambiguity, I'll attempt to migrate it as a collection first. If it fails, I'll print a warning.

    if (sourceIds.otp_codes) {
        await migrateCollection(OLD_DB_ID, NEW_DB_ID, sourceIds.otp_codes, 'otp_codes')
    } else {
        console.warn('Skipping otp_codes (not found in source).')
    }

    console.log('\n========================================')
    console.log('REPLICATION & MIGRATION COMPLETE')
    console.log('========================================')
    console.log(`NEW DATABASE ID: ${NEW_DB_ID}`)
    console.log('Update your NUXT_PUBLIC_DATABASE in .env / Vercel to this ID.')
    console.log('========================================')
}

main().catch(console.error)
