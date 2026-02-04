import 'dotenv/config'
import { Client, Databases, Users, Query, ID } from 'node-appwrite'

export function createAppwriteClient() {
    const project = process.env.NUXT_PUBLIC_PROJECT
    const apiKey = process.env.NUXT_APPWRITE_KEY

    if (!project || !apiKey) {
        console.error('Missing required env vars: NUXT_PUBLIC_PROJECT, NUXT_APPWRITE_KEY')
        process.exit(1)
    }

    const client = new Client()
        .setEndpoint('https://cloud.appwrite.io/v1')
        .setProject(project)
        .setKey(apiKey)

    return {
        client,
        databases: new Databases(client),
        users: new Users(client),
        Query,
        ID,
    }
}

export function getDatabaseId(): string {
    const id = process.env.NUXT_PUBLIC_DATABASE
    if (!id) {
        console.error('Missing required env var: NUXT_PUBLIC_DATABASE')
        process.exit(1)
    }
    return id
}
