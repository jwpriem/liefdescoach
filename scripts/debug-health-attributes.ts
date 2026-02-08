
import { Client, Databases } from 'node-appwrite'
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

async function debugAttributes() {
    console.log(`Checking attributes for 'health' in DB: ${DB_ID}`)
    try {
        const attrs = await databases.listAttributes(DB_ID, 'health')
        console.log(JSON.stringify(attrs, null, 2))
    } catch (e: any) {
        console.error('Error:', e.message)
    }
}

debugAttributes().catch(console.error)
