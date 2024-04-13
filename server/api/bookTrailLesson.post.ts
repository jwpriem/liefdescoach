import { ref } from 'vue';
import { Client, Databases, ID } from 'node-appwrite';
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
    
    const user = await databases.createDocument(
        config.public.database,
        'students',
        ID.unique(),
        {
            name: body.name + ' (Proefles)',
            email: body.email
        }
    );
    
    const res = await databases.createDocument(
        config.public.database,
        'bookings',
        ID.unique(),
        {
            students: user.$id,
            lessons: body.lessonId
        }
    );
    
    return Object.assign({}, res)
})