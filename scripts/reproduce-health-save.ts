
import { Client, Databases, Query } from 'node-appwrite'
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

// The student ID from the user's log
const TEST_STUDENT_ID = '65b3c1c3d0a946917844'

async function reproduce() {
    console.log(`Attempting to update health for student: ${TEST_STUDENT_ID}`)

    try {
        // 1. Find existing health record
        const healthRes = await databases.listDocuments(
            DB_ID,
            'health',
            [
                Query.equal('student', [TEST_STUDENT_ID]),
                Query.limit(1)
            ]
        )

        if (healthRes.documents.length === 0) {
            console.log('No existing health record found for this student. Creating one...')
            // If not found, we might need to create it to test the update later, 
            // but user said "Update" failed. 
            // Let's try to create one if missing
            const ID = await import('node-appwrite').then(m => m.ID)
            const newHealth = await databases.createDocument(
                DB_ID,
                'health',
                ID.unique(),
                {
                    injury: 'Test Injury',
                    pregnancy: false,
                    dueDate: null,
                    student: TEST_STUDENT_ID
                }
            )
            console.log('Created health record:', newHealth.$id)
            return
        }

        const existing = healthRes.documents[0]
        console.log('Found existing health record:', JSON.stringify(existing, null, 2))
        console.log('Existing student type:', typeof existing.student)
        if (typeof existing.student === 'object') {
            console.log('Existing student is object:', existing.student.$id)
        }

        // 2. Perform Update (mimicking update.post.ts)
        const data = {
            injury: 'Reproduce Update With Student ID Array',
            pregnancy: false,
            // dueDate: null, 
            student: [existing.student] // Try sending as array
        }

        console.log('Updating with data:', JSON.stringify(data))

        const result = await databases.updateDocument(
            DB_ID,
            'health',
            existing.$id,
            data
        )

        console.log('Update Success:', JSON.stringify(result, null, 2))

    } catch (e: any) {
        console.error('Update Failed!')
        console.error('Error Message:', e.message)
        console.error('Error Type:', e.type)
        console.error('Error Code:', e.code)
    }
}

reproduce().catch(console.error)
