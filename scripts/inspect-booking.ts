
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

async function inspect() {
    console.log(`Inspecting Booking in DB: ${DB_ID}`)
    try {
        const list = await databases.listDocuments(DB_ID, 'bookings', [Query.limit(1)])
        if (list.documents.length === 0) {
            console.log('No bookings found to inspect.')
            return
        }
        const booking = list.documents[0]
        console.log('Booking Document Structure:')
        console.log(JSON.stringify(booking, null, 2))

        console.log('\n--- Analysis ---')
        console.log('lessons type:', Array.isArray(booking.lessons) ? 'Array' : typeof booking.lessons)
        console.log('students type:', Array.isArray(booking.students) ? 'Array' : typeof booking.students)
    } catch (e: any) {
        console.error('Error:', e.message)
    }
}

inspect().catch(console.error)
