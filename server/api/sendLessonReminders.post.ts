import { createError } from 'h3'
import { and, gte, lte, eq } from 'drizzle-orm'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import 'dayjs/locale/nl.js'
import { lessons, bookings, students } from '../database/schema'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('nl')

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()

    // Auth: verify cron secret
    const apiKey = getHeader(event, 'x-api-key')
    if (!config.cronSecret || apiKey !== config.cronSecret) {
        throw createError({ statusCode: 401, statusMessage: 'Ongeldige API-sleutel' })
    }


    // Calculate tomorrow's date range
    const nowAmsterdam = dayjs().tz('Europe/Amsterdam')
    const tomorrowStart = nowAmsterdam.add(1, 'day').startOf('day').utc().toDate()
    const tomorrowEnd = nowAmsterdam.add(1, 'day').endOf('day').utc().toDate()

    // Fetch lessons scheduled for tomorrow
    const lessonRows = await db
        .select()
        .from(lessons)
        .where(
            and(
                gte(lessons.date, tomorrowStart),
                lte(lessons.date, tomorrowEnd)
            )
        )
        .limit(50)

    if (lessonRows.length === 0) {
        return { lessonsFound: 0, emailsSent: 0 }
    }

    let emailsSent = 0
    const errors: string[] = []

    for (const lesson of lessonRows) {
        // Fetch bookings with student data
        const bookingRows = await db
            .select({
                studentId: students.id,
                studentName: students.name,
                studentEmail: students.email,
                reminders: students.reminders,
            })
            .from(bookings)
            .innerJoin(students, eq(bookings.studentId, students.id))
            .where(eq(bookings.lessonId, lesson.id))

        if (bookingRows.length === 0) continue

        const lessonDate = dayjs(lesson.date).utc()
        const lessonType = lesson.type === 'guest lesson'
            ? `Yin-Yang Yoga door gastdocent ${lesson.teacher}`
            : lesson.type === 'peachy bum' ? 'Peachy Bum' : 'Hatha Yoga'
        const formattedDate = `${lessonDate.format('dddd D MMMM')} van ${lessonDate.format('H.mm')} tot ${lessonDate.add(1, 'hour').format('H.mm')} uur`
        const address = lesson.type === 'peachy bum'
            ? 'Kosboulevard 5, 3059 XZ Rotterdam'
            : 'Emmy van Leersumhof 24a, 3059 LT Rotterdam'

        for (const student of bookingRows) {
            if (!student.studentEmail) continue

            // Check reminder opt-out
            if (student.reminders === false) {
                console.log(`[LessonReminder] Skipped ${student.studentEmail} (reminders disabled)`)
                continue
            }

            const mail = lessonReminderEmail({
                name: student.studentName || 'Yogi',
                lessonType,
                lessonDate: formattedDate,
                address,
            })

            try {
                await smtpTransport.sendMail({
                    from: 'Yoga Ravennah <info@ravennah.com>',
                    to: student.studentEmail,
                    subject: mail.subject,
                    html: mail.html,
                    text: mail.text,
                })
                emailsSent++
                console.log(`[LessonReminder] Sent to ${student.studentEmail} for lesson ${lesson.id}`)
            } catch (err: any) {
                const msg = `Failed to send to ${student.studentEmail}: ${err?.message ?? err}`
                console.error(`[LessonReminder] ${msg}`)
                errors.push(msg)
            }

            await new Promise(resolve => setTimeout(resolve, 100))
        }
    }

    console.log(`[LessonReminder] Done. Lessons: ${lessonRows.length}, Emails sent: ${emailsSent}, Errors: ${errors.length}`)

    return {
        lessonsFound: lessonRows.length,
        emailsSent,
        errors: errors.length > 0 ? errors : undefined,
    }
})
