import { ref } from 'vue';
import { Client, Account, Databases, ID } from 'appwrite';
import { useRuntimeConfig } from '#imports';

export function useAppwrite() {
    const client = new Client();
    const config = useRuntimeConfig();

    client
        .setEndpoint('https://cloud.appwrite.io/v1') // Use your Appwrite endpoint
        .setProject(config.public.project); // Use your Appwrite project ID

    const account = new Account(client);
    const databases = new Databases(client);

    // Return the Appwrite account and databases services, and ID for external use
    return { account, databases, ID };
}