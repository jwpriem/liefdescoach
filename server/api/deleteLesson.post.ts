import { createError } from 'h3'
import { eq, inArray } from 'drizzle-orm'
import { lessons, bookings, credits } from '../database/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  if (!body?.lessonId || typeof body.lessonId !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'lessonId is verplicht' })
  }

  const { lessonId } = body

  // Find all bookings for this lesson
  const lessonBookings = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.lessonId, lessonId))

  // Release credits for each booking (refund students)
  if (lessonBookings.length) {
    const bookingIds = lessonBookings.map(b => b.id)
    await db.update(credits)
      .set({ bookingId: null, usedAt: null })
      .where(inArray(credits.bookingId, bookingIds))
  }

  // Delete lesson — bookings cascade-delete automatically via FK onDelete: 'cascade'
  await db.delete(lessons).where(eq(lessons.id, lessonId))

  return { success: true }
})
