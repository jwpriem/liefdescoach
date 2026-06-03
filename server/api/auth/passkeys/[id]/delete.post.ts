import { createError, getRouterParam } from 'h3'
import { and, eq } from 'drizzle-orm'
import { passkeyCredentials } from '../../../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Passkey is verplicht' })
  }

  const deleted = await db
    .delete(passkeyCredentials)
    .where(and(
      eq(passkeyCredentials.id, id),
      eq(passkeyCredentials.studentId, user.$id)
    ))
    .returning({ id: passkeyCredentials.id })

  if (deleted.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Passkey niet gevonden' })
  }

  return { success: true }
})
