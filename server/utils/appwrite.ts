import { Client, Users, Query, ID } from 'node-appwrite'
import { TablesDB } from 'node-appwrite'

let _client: Client | null = null

export function useServerAppwrite() {
    if (!_client) {
        const config = useRuntimeConfig()
        _client = new Client()
        _client
            .setEndpoint('https://cloud.appwrite.io/v1')
            .setProject(config.public.project)
            .setKey(config.appwriteKey)
    }

    const tablesDB = new TablesDB(_client)
    const users = new Users(_client)

    return { client: _client, tablesDB, users, Query, ID }
}
