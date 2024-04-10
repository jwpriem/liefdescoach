import { ref } from 'vue';
import { Client, Users, Query } from 'node-appwrite';
import { useRuntimeConfig } from '#imports';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();

    const client = new Client();

    client
    .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
    .setProject(config.public.project) // Your project ID
    .setKey(config.appwriteKey) // Your secret API key
    
    const users = new Users(client);
    const res = await users.list(
        [
            Query.orderAsc("name"),
            Query.limit(100)
        ]
    );

    return Object.assign({}, res)
})