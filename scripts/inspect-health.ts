
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

async function inspectHealth() {
    console.log(`Inspecting 'health' documents in DB: ${DB_ID}`)
    try {
        const list = await databases.listDocuments(DB_ID, 'health', [Query.limit(5)])
        console.log(`Found ${list.total} health records.`)

        if (list.documents.length === 0) {
            console.log('No health records found.')
            return
        }

        for (const doc of list.documents) {
            console.log('\n--- Health Record ---')
            console.log(JSON.stringify(doc, null, 2))
            // Check relationship type
            console.log('student type:', Array.isArray(doc.student) ? 'Array' : typeof doc.student)
        }

    } catch (e: any) {
        console.error('Error:', e.message)
    }
}

inspectHealth().catch(console.error)
