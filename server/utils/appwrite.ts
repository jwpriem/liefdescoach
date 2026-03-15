import { Client, Users, Query, ID, Databases, TablesDB } from 'node-appwrite'

let _client: Client | null = null
let _tablesDB: TablesDB | null = null
let _databases: Databases | null = null
let _users: Users | null = null

export function useServerAppwrite() {
    if (!_client) {
        const config = useRuntimeConfig()
        _client = new Client()
        _client
            .setEndpoint('https://cloud.appwrite.io/v1')
            .setProject(config.public.project)
            .setKey(config.appwriteKey)
        _tablesDB = new TablesDB(_client)
        _databases = new Databases(_client)
        _users = new Users(_client)
    }

    return { client: _client, tablesDB: _tablesDB!, databases: _databases!, users: _users!, Query, ID }
}
