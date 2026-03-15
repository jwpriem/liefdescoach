/**
 * Legacy Appwrite utilities — only used during lazy password migration.
 * Can be removed once all users have logged in and passwordHash is populated.
 *
 * The lazy migration in auth/login.post.ts imports node-appwrite directly
 * when needed, so this file can be safely deleted when migration is complete.
 */
