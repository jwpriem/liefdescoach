
import 'dotenv/config'
import { Client, Databases } from 'node-appwrite'

const PROJECT_ID = process.env.NUXT_PUBLIC_PROJECT
const API_KEY = process.env.NUXT_APPWRITE_KEY

if (!PROJECT_ID || !API_KEY) {
    console.error('Missing env vars')
    process.exit(1)
}

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(PROJECT_ID)
    .setKey(API_KEY)

const databases = new Databases(client)

async function main() {
    console.log(`Project: ${PROJECT_ID}`)
    try {
        const dbs = await databases.list()
        console.log(`Found ${dbs.total} databases:`)
        dbs.databases.forEach(db => {
            console.log(`- ${db.name} (${db.$id})`)
        })
    } catch (e) {
        console.error('Error listing databases:', e)
    }
}

main()
