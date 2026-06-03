import { desc, eq } from 'drizzle-orm'
import { passkeyCredentials } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const passkeys = await db
    .select({
      id: passkeyCredentials.id,
      deviceType: passkeyCredentials.deviceType,
      backedUp: passkeyCredentials.backedUp,
      createdAt: passkeyCredentials.createdAt,
      lastUsedAt: passkeyCredentials.lastUsedAt,
    })
    .from(passkeyCredentials)
    .where(eq(passkeyCredentials.studentId, user.$id))
    .orderBy(desc(passkeyCredentials.createdAt))

  return { passkeys }
})
