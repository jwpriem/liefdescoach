import bcrypt from 'bcryptjs'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq, inArray } from 'drizzle-orm'
import * as schema from '../../server/database/schema'
import { E2E_PASSWORD, E2E_STUDENT, E2E_ADMIN, E2E_LESSON_IDS, E2E_CREDITS } from '../../e2e/fixtures'

const DAY = 24 * 60 * 60 * 1000

/**
 * Makes an e2e branch predictable: a student with free credits, an admin, and
 * two future lessons with free spots. Safe to run repeatedly.
 */
export async function seedE2E(databaseUrl: string): Promise<void> {
    const db = drizzle(neon(databaseUrl), { schema })
    const passwordHash = await bcrypt.hash(E2E_PASSWORD, 10)
    const now = new Date()

    for (const user of [{ ...E2E_STUDENT, isAdmin: false }, { ...E2E_ADMIN, isAdmin: true }]) {
        const values = { name: user.name, email: user.email, passwordHash, isAdmin: user.isAdmin, emailVerified: true, archived: false, phoneRequested: true }
        await db.insert(schema.students)
            .values({ id: user.id, ...values })
            .onConflictDoUpdate({ target: schema.students.id, set: values })
    }

    for (const [index, id] of E2E_LESSON_IDS.entries()) {
        const date = new Date(now.getTime() + (3 + index * 7) * DAY)
        await db.insert(schema.lessons)
            .values({ id, date, type: 'hatha yoga', teacher: 'Ravennah', maxSpots: 9 })
            .onConflictDoUpdate({ target: schema.lessons.id, set: { date, maxSpots: 9 } })
    }
    // Empty the seeded lessons. Credits reference bookings (no cascade), so release them first.
    const seededBookings = db.select({ id: schema.bookings.id }).from(schema.bookings)
        .where(inArray(schema.bookings.lessonId, [...E2E_LESSON_IDS]))
    await db.update(schema.credits).set({ bookingId: null, usedAt: null })
        .where(inArray(schema.credits.bookingId, seededBookings))
    await db.delete(schema.bookings).where(inArray(schema.bookings.lessonId, [...E2E_LESSON_IDS]))

    // Fresh, unused credits for the student
    await db.delete(schema.credits).where(eq(schema.credits.studentId, E2E_STUDENT.id))
    await db.insert(schema.credits).values(
        Array.from({ length: E2E_CREDITS }, (_, i) => ({
            id: `e2e-credit-${i + 1}`,
            studentId: E2E_STUDENT.id,
            bookingId: null,
            type: 'credit_5' as const,
            validFrom: now,
            validTo: new Date(now.getTime() + 180 * DAY),
            createdAt: now,
            usedAt: null,
        }))
    )
}
