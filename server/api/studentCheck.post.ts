import { ref } from 'vue';
import { Client, Databases, Query } from 'node-appwrite';
import { useRuntimeConfig } from '#imports';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const client = new Client();

    client
        .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
        .setProject(config.public.project) // Your project ID
        .setKey(config.appwriteKey) // Your secret API key

    const databases = new Databases(client);
    const body = await readBody(event)
    const res = await databases.listDocuments(
        config.public.database,
        'students',
        [
            Query.equal('email', [body.email])
        ]
    );
    
    return Object.assign({}, res)
})