import { ref } from 'vue';
import { Client, Users } from 'node-appwrite';
import { useRuntimeConfig } from '#imports';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();

    const client = new Client();

    client
    .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
    .setProject(config.public.project) // Your project ID
    .setKey(config.appwriteKey) // Your secret API key
    
    const users = new Users(client);
    const res = await users.list();

    return Object.assign({}, res)
})