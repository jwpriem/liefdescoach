
import { Client, Databases, ID, Query } from 'node-appwrite'
import dotenv from 'dotenv'

dotenv.config()

// --- Configuration ---
const PROJECT = process.env.NUXT_PUBLIC_PROJECT_PRD || process.env.NUXT_PUBLIC_PROJECT
const API_KEY = process.env.NUXT_APPWRITE_KEY_PRD || process.env.NUXT_APPWRITE_KEY
const DB_ID = process.env.NUXT_PUBLIC_DATABASE_PRD || process.env.NUXT_PUBLIC_DATABASE

if (!PROJECT || !API_KEY || !DB_ID) {
    console.error('Error: Missing required environment variables')
    process.exit(1)
}

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(PROJECT)
    .setKey(API_KEY)

const databases = new Databases(client)

const TEST_STUDENT_ID = '65b3c1c3d0a946917844'

async function verifyPersistence() {
    console.log('--- Verifying persistence of Student Relationship ---')

    try {
        // 0. Cleanup existing
        const existingRes = await databases.listDocuments(DB_ID, 'health', [Query.equal('student', [TEST_STUDENT_ID])])
        if (existingRes.documents.length > 0) {
            console.log('Deleting existing health record...')
            await databases.deleteDocument(DB_ID, 'health', existingRes.documents[0].$id)
        }

        // 1. Create a NEW Health Record
        console.log('Creating new health record...')
        const newHealth = await databases.createDocument(
            DB_ID,
            'health',
            ID.unique(),
            {
                injury: 'Persistence Test',
                pregnancy: false,
                student: TEST_STUDENT_ID
            }
        )
        const docId = newHealth.$id
        console.log(`Created: ${docId}, Student ID: ${newHealth.student.$id}`)

        // 2. Update with Object ID
        console.log('Updating with Object { $id: ... }...')
        const updated = await databases.updateDocument(
            DB_ID,
            'health',
            docId,
            {
                injury: 'Persistence Test Update Object',
                // student: TEST_STUDENT_ID
                student: { $id: TEST_STUDENT_ID } // Try object format?
            }
        )
        console.log(`Updated Result: Student: ${updated.student}`)

        // 3. Fetch again to double check
        const fetched = await databases.getDocument(DB_ID, 'health', docId)
        console.log(`Fetched: Student: ${fetched.student}`)
        console.log('Student is null?', fetched.student === null)

        // Cleanup
        console.log('Cleaning up...')
        await databases.deleteDocument(DB_ID, 'health', docId)

    } catch (e: any) {
        console.error('Error:', e.message)
    }
}

verifyPersistence().catch(console.error)
