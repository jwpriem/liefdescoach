import { ref } from 'vue';
import { Client, TablesDB, Query } from 'node-appwrite';
import { useRuntimeConfig } from '#imports';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const client = new Client();

    client
        .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
        .setProject(config.public.project) // Your project ID
        .setKey(config.appwriteKey) // Your secret API key

    const tablesDB = new TablesDB(client);
    const body = await readBody(event)
    const res = await tablesDB.listRows(
        config.public.database,
        'bookings',
        [
            Query.equal('students', [body.userId]),
            Query.select(['*', 'lessons.*']),
            Query.limit(100)
        ]
    );

    return Object.assign({}, res)
})