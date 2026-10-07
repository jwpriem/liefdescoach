import { and, eq, gt, inArray, isNull } from 'drizzle-orm'
import { bookings, credits, health, lessons, loginHistory, otpCodes, passkeyCredentials, pushSubscriptions, sessions, students } from '../database/schema'

export const DELETED_ACCOUNT_NAME = 'Verwijderd account'

export type DeletedAccount = {
    name: string
    email: string | null
    cancelledLessons: { type: string | null; teacher: string | null; date: Date }[]
    unusedCredits: number
}

/**
 * Deletes a member's account by anonymising it in place.
 *
 * The student row stays, stripped of everything personal, so past bookings and credit history
 * (which the revenue report reads, and which `credits.student_id` requires) remain as anonymous records.
 * Everything else that is personal is removed, upcoming bookings are cancelled, and it all happens
 * in one atomic batch. Returns what the caller needs for the confirmation emails, or null if there is no such student.
 */
export async function deleteAccount(studentId: string): Promise<DeletedAccount | null> {
    const [student] = await db
        .select({ name: students.name, email: students.email })
        .from(students)
        .where(eq(students.id, studentId))
        .limit(1)
    if (!student) return null

    const now = new Date()
    const upcoming = await db
        .select({ bookingId: bookings.id, type: lessons.type, teacher: lessons.teacher, date: lessons.date })
        .from(bookings)
        .innerJoin(lessons, eq(bookings.lessonId, lessons.id))
        .where(and(eq(bookings.studentId, studentId), gt(lessons.date, now)))
    const unused = await db
        .select({ id: credits.id })
        .from(credits)
        .where(and(eq(credits.studentId, studentId), isNull(credits.bookingId), gt(credits.validTo, now)))

    const upcomingBookingIds = upcoming.map((booking) => booking.bookingId)
    const queries = [
        // A credit points at the booking it paid for, so it is released before that booking can go
        ...(upcomingBookingIds.length > 0
            ? [
                db.update(credits).set({ bookingId: null, usedAt: null }).where(inArray(credits.bookingId, upcomingBookingIds)),
                db.delete(bookings).where(inArray(bookings.id, upcomingBookingIds)),
            ]
            : []),
        db.delete(health).where(eq(health.studentId, studentId)),
        db.delete(sessions).where(eq(sessions.userId, studentId)),
        db.delete(passkeyCredentials).where(eq(passkeyCredentials.studentId, studentId)),
        db.delete(pushSubscriptions).where(eq(pushSubscriptions.studentId, studentId)),
        db.delete(loginHistory).where(eq(loginHistory.studentId, studentId)),
        db.delete(otpCodes).where(eq(otpCodes.userId, studentId)),
        db.update(students)
            .set({
                name: DELETED_ACCOUNT_NAME,
                email: null,
                passwordHash: null,
                phone: null,
                dateOfBirth: null,
                archived: true,
                emailVerified: false,
                reminders: false,
                pushNotifications: false,
                phoneRequested: false,
            })
            .where(eq(students.id, studentId)),
    ]
    // All or nothing: the Neon HTTP driver runs a batch as one transaction
    await db.batch(queries as [typeof queries[number], ...typeof queries])

    return {
        name: student.name,
        email: student.email,
        cancelledLessons: upcoming.map(({ type, teacher, date }) => ({ type, teacher, date })),
        unusedCredits: unused.length,
    }
}
