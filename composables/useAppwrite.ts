import { Client, Account, Databases, TablesDB, ID, Query } from 'appwrite';
import { useRuntimeConfig } from '#imports';

let _client: Client | null = null
let _account: Account | null = null
let _databases: Databases | null = null
let _tablesDB: TablesDB | null = null

export function useAppwrite() {
    if (!_client) {
        const config = useRuntimeConfig();
        _client = new Client();
        _client
            .setEndpoint('https://cloud.appwrite.io/v1')
            .setProject(config.public.project);
        _account = new Account(_client);
        _databases = new Databases(_client);
        _tablesDB = new TablesDB(_client);
    }

    return { account: _account!, databases: _databases!, tablesDB: _tablesDB!, ID, Query };
}
