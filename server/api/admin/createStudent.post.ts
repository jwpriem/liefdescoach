import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { students } from '../../database/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const rawEmail = typeof body?.email === 'string' ? body.email.trim() : ''
  const email = rawEmail === '' ? null : rawEmail.toLowerCase()

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Naam is verplicht' })
  }

  if (email) {
    const existing = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.email, email))
      .limit(1)
    if (existing.length > 0) {
      throw createError({ statusCode: 409, statusMessage: 'Er bestaat al een gebruiker met dit e-mailadres' })
    }
  }

  const id = generateId()
  await db.insert(students).values({
    id,
    name,
    email,
  })

  return {
    success: true,
    student: {
      $id: id,
      name,
      email,
    },
  }
})
