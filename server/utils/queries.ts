import { eq, and, isNull, gt, gte, lte, asc, desc, sql, count as countFn } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { lessons, bookings, credits, students, health } from '../database/schema'

/**
 * Fetch a lesson with its bookings (and optionally student data).
 */
export async function getLessonWithBookings(lessonId: string, includeStudents = false) {
  const db = useDB()

  const lesson = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1)
  if (lesson.length === 0) return null

  let bookingRows: any[]
  if (includeStudents) {
    bookingRows = await db
      .select({
        id: bookings.id,
        lessonId: bookings.lessonId,
        studentId: bookings.studentId,
        createdAt: bookings.createdAt,
        studentName: students.name,
        studentEmail: students.email,
      })
      .from(bookings)
      .leftJoin(students, eq(bookings.studentId, students.id))
      .where(eq(bookings.lessonId, lessonId))
  } else {
    bookingRows = await db.select().from(bookings).where(eq(bookings.lessonId, lessonId))
  }

  return {
    ...lesson[0],
    bookings: bookingRows,
  }
}

/**
 * Count bookings for a lesson.
 */
export async function countLessonBookings(lessonId: string): Promise<number> {
  const db = useDB()
  const result = await db
    .select({ count: countFn() })
    .from(bookings)
    .where(eq(bookings.lessonId, lessonId))
  return result[0]?.count ?? 0
}

/**
 * Find an available (unused, non-expired) credit for a student, FIFO by expiry.
 */
export async function findAvailableCredit(studentId: string) {
  const db = useDB()
  const now = new Date()
  const result = await db
    .select()
    .from(credits)
    .where(
      and(
        eq(credits.studentId, studentId),
        isNull(credits.bookingId),
        gt(credits.validTo, now)
      )
    )
    .orderBy(asc(credits.validTo))
    .limit(1)
  return result[0] ?? null
}

/**
 * Generate a nanoid for new records.
 */
export function generateId(): string {
  return nanoid()
}

/**
 * Transform a flat lesson + bookings query result into the nested shape the client expects.
 * Maps `id` → `$id` and nests bookings under each lesson.
 */
export function nestLessonsWithBookings(
  lessonRows: any[],
  bookingRows: any[],
  includeStudents = false
): { rows: any[]; total: number } {
  // Group bookings by lessonId
  const bookingsByLesson = new Map<string, any[]>()
  for (const b of bookingRows) {
    const lessonId = b.lessonId
    if (!bookingsByLesson.has(lessonId)) {
      bookingsByLesson.set(lessonId, [])
    }
    const booking: any = {
      $id: b.id,
      lessons: b.lessonId,
      students: includeStudents && b.studentName
        ? { $id: b.studentId, name: b.studentName, email: b.studentEmail, injury: b.studentInjury ?? null, pregnancy: b.studentPregnancy ?? false }
        : b.studentId,
    }
    bookingsByLesson.get(lessonId)!.push(booking)
  }

  const rows = lessonRows.map((l) => ({
    $id: l.id,
    date: l.date?.toISOString?.() ?? l.date,
    type: l.type,
    teacher: l.teacher,
    bookings: bookingsByLesson.get(l.id) ?? [],
  }))

  return { rows, total: rows.length }
}

/**
 * Transform booking rows with joined lesson data into the nested shape the client expects.
 */
export function nestBookingsWithLessons(rows: any[]): { rows: any[]; total: number } {
  const result = rows.map((r) => ({
    $id: r.bookingId ?? r.id,
    lessons: r.lessonId ? {
      $id: r.lessonId,
      date: r.lessonDate?.toISOString?.() ?? r.lessonDate,
      type: r.lessonType,
      teacher: r.lessonTeacher,
    } : r.lessonId,
    students: r.studentId ? {
      $id: r.studentId,
      name: r.studentName,
      email: r.studentEmail,
    } : r.studentId,
  }))

  return { rows: result, total: result.length }
}
