import { eq } from 'drizzle-orm'
import { lessons, bookings, students } from '../database/schema'
import { bookingChangePush, creditsEmptyPush } from './pushMessages'
import { calendarLink, lessonTypeLabel } from '../../shared/lesson'
import { MAIL_FROM, STUDIO_EMAIL } from './constants'

export type BookingNotificationKind = 'confirmation' | 'cancellation'

function calendarLinks(lesson: { type: string | null }, lessonDate: Date) {
    return {
        apple: calendarLink('apple', lesson, lessonDate),
        google: calendarLink('gmail', lesson, lessonDate),
        outlook: calendarLink('outlook', lesson, lessonDate),
    }
}

/**
 * Emails the student + studio and pushes to admins after a booking change.
 * All personal data is read from the database — never from the request.
 */
export async function sendBookingNotifications(
    kind: BookingNotificationKind,
    { lessonId, studentId }: { lessonId: string; studentId: string }
): Promise<void> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1)
    const [student] = await db
        .select({ name: students.name, email: students.email })
        .from(students)
        .where(eq(students.id, studentId))
        .limit(1)

    if (!lesson || !student?.email) return

    const bookingRows = await db
        .select({ studentName: students.name })
        .from(bookings)
        .leftJoin(students, eq(bookings.studentId, students.id))
        .where(eq(bookings.lessonId, lessonId))

    const isConfirmation = kind === 'confirmation'
    const label = isConfirmation ? 'BookingConfirmation' : 'BookingCancellation'
    const lessonDate = new Date(lesson.date!)
    const lessonType = lessonTypeLabel(lesson)
    const formattedDate = formatLessonDate(lessonDate)

    const adminData = {
        name: student.name,
        email: student.email,
        lessonType,
        lessonDate: formattedDate,
        spots: lesson.maxSpots - bookingRows.length,
        bookings: bookingRows.map((b) => ({ name: b.studentName ?? 'Onbekend' })),
    }

    const studentMail = isConfirmation
        ? bookingStudentEmail({ name: student.name, lessonType, lessonDate: formattedDate, calendarLinks: calendarLinks(lesson, lessonDate) })
        : cancellationStudentEmail({ name: student.name, lessonType, lessonDate: formattedDate })
    const adminMail = isConfirmation ? bookingAdminEmail(adminData) : cancellationAdminEmail(adminData)

    await Promise.allSettled(
        [
            { label: 'student', to: student.email, ...studentMail },
            { label: 'admin', to: STUDIO_EMAIL, ...adminMail },
        ].map(async (mail) => {
            try {
                const result = await smtpTransport.sendMail({ from: MAIL_FROM, to: mail.to, subject: mail.subject, html: mail.html, text: mail.text })
                console.log(`[${label}] ${mail.label} email sent:`, result?.accepted)
            } catch (err: any) {
                console.error(`[${label}] ${mail.label} email failed:`, err?.message ?? err)
            }
        })
    )

    const pushes = [bookingChangePush(kind, student.name, lessonType, formattedDate)]
    if (isConfirmation && !(await findAvailableCredit(studentId))) {
        pushes.push(creditsEmptyPush(student.name, studentId))
    }

    for (const push of pushes) {
        try {
            await sendPushToAdmins(push)
        } catch (err: any) {
            console.error(`[${label}] Admin push failed:`, err?.message ?? err)
        }
    }
}
