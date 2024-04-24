import {Client, Users} from 'node-appwrite';
import {useRuntimeConfig} from '#imports';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();

    const client = new Client();

    client
        .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
        .setProject(config.public.project) // Your project ID
        .setKey(config.appwriteKey) // Your secret API key

    const body = await readBody(event)
    const users = new Users(client);
    const current = await users.getPrefs(body.userId)
    const newPrefs = {...current, ...body.prefs}
    const res = await users.updatePrefs(body.userId, newPrefs);

    return {res}
})