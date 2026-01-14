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

    const databases = new TablesDB(client);
    const body = await readBody(event)
    const res = await databases.listRows(
        config.public.database,
        'students',
        [
            Query.equal('email', [body.email])
        ]
    );
    
    return Object.assign({}, res)
})