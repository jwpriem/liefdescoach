import { eq } from 'drizzle-orm'
import { lessons, bookings, students } from '../database/schema'

export type BookingNotificationKind = 'confirmation' | 'cancellation'

const FROM = 'Yoga Ravennah <info@ravennah.com>'
const ADMIN_EMAIL = 'info@ravennah.com'

function lessonTitle(lesson: { type: string | null; teacher: string | null }) {
    if (lesson.type === 'guest lesson') return `Yin-Yang Yoga door gastdocent ${lesson.teacher}`
    return lesson.type === 'peachy bum' ? 'Peachy Bum' : 'Hatha Yoga'
}

function calendarLinks(lesson: { type: string | null }, lessonDate: Date) {
    const address = lesson.type === 'peachy bum'
        ? 'Kosboulevard 5, 3059 XZ Rotterdam'
        : 'Emmy van Leersumhof 24a, 3059 LT Rotterdam'
    const title = lesson.type === 'peachy bum' ? 'Peachy Bum les' : 'Hatha Yoga les'
    const link = (stream: string) =>
        `https://calndr.link/d/event/?service=${stream}&start=${formatISODate(lessonDate)}%20${formatHour(lessonDate)}:${formatMinutes(lessonDate)}&title=${title}%20Ravennah&timezone=Europe/Amsterdam&location=${encodeURIComponent(address)}`
    return { apple: link('apple'), google: link('gmail'), outlook: link('outlook') }
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
    const lessonType = lessonTitle(lesson)
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
            { label: 'admin', to: ADMIN_EMAIL, ...adminMail },
        ].map(async (mail) => {
            try {
                const result = await smtpTransport.sendMail({ from: FROM, to: mail.to, subject: mail.subject, html: mail.html, text: mail.text })
                console.log(`[${label}] ${mail.label} email sent:`, result?.accepted)
            } catch (err: any) {
                console.error(`[${label}] ${mail.label} email failed:`, err?.message ?? err)
            }
        })
    )

    const pushes = [{
        title: isConfirmation ? 'Nieuwe boeking' : 'Annulering',
        body: `${student.name} heeft ${lessonType} ${isConfirmation ? 'geboekt' : 'geannuleerd'} op ${formattedDate}`,
        url: '/account',
    }]
    if (isConfirmation && !(await findAvailableCredit(studentId))) {
        pushes.push({ title: 'Credits op', body: `${student.name} heeft geen credits meer`, url: '/account' })
    }

    for (const push of pushes) {
        try {
            await sendPushToAdmins(push)
        } catch (err: any) {
            console.error(`[${label}] Admin push failed:`, err?.message ?? err)
        }
    }
}
