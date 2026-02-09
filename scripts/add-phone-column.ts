/**
 * Migration script to add phone column to students collection
 * and migrate existing phone numbers from Auth users.
 * 
 * Run with: npx tsx scripts/add-phone-column.ts
 */
import { Query, Users } from 'node-appwrite'
import { createAppwriteClient, getDatabaseId } from './appwrite-client'

const { client, databases } = createAppwriteClient()
const users = new Users(client)

const DATABASE_ID = getDatabaseId()
const COLLECTION_ID = 'students'

async function addPhoneColumn() {
    console.log('Adding phone attribute to students collection...')

    try {
        // Try to create the attribute
        await databases.createStringAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            'phone',
            50,  // max length for phone number
            false // not required
        )
        console.log('Phone attribute created successfully!')

        // Wait for attribute to be available
        console.log('Waiting for attribute to become available...')
        let status = 'processing'
        while (status === 'processing') {
            await new Promise(resolve => setTimeout(resolve, 1000))
            const attr = await databases.getAttribute(DATABASE_ID, COLLECTION_ID, 'phone')
            status = attr.status
            console.log('  Status:', status)
        }

        if (status !== 'available') {
            console.error('Attribute failed to become available:', status)
            return false
        }
    } catch (e: any) {
        if (e.code === 409) {
            console.log('Phone attribute already exists.')
            const attr = await databases.getAttribute(DATABASE_ID, COLLECTION_ID, 'phone')
            console.log('Status:', attr.status)
        } else {
            throw e
        }
    }

    return true
}

async function migratePhoneNumbers() {
    console.log('\nMigrating phone numbers from Auth users to students collection...')

    let migrated = 0
    let skipped = 0
    let noPhone = 0

    // Get all students
    let offset = 0
    const limit = 100

    while (true) {
        const studentsRes = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [Query.limit(limit), Query.offset(offset)]
        )

        if (studentsRes.documents.length === 0) {
            break
        }

        for (const student of studentsRes.documents) {
            // Skip if already has phone in students collection
            if (student.phone) {
                skipped++
                continue
            }

            try {
                // Get the Auth user to check for phone
                const user = await users.get(student.$id)

                if (user.phone) {
                    // Migrate phone to students collection
                    await databases.updateDocument(
                        DATABASE_ID,
                        COLLECTION_ID,
                        student.$id,
                        { phone: user.phone }
                    )
                    console.log(`  Migrated phone for ${student.name}: ${user.phone}`)
                    migrated++
                } else {
                    noPhone++
                }
            } catch (e: any) {
                console.error(`  Error for ${student.name} (${student.$id}):`, e.message)
            }
        }

        offset += limit

        if (studentsRes.documents.length < limit) {
            break
        }
    }

    console.log(`\nMigration complete:`)
    console.log(`  - Migrated: ${migrated}`)
    console.log(`  - Already had phone in DB: ${skipped}`)
    console.log(`  - No phone in Auth: ${noPhone}`)
}

async function main() {
    const columnAdded = await addPhoneColumn()

    if (columnAdded) {
        await migratePhoneNumbers()
    }

    console.log('\nDone!')
}

main().catch(console.error)
