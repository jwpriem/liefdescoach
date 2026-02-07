import { createError } from 'h3'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/nl'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('nl')

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()

    // --- Auth: verify cron secret ---
    const apiKey = getHeader(event, 'x-api-key')
    if (!config.cronSecret || apiKey !== config.cronSecret) {
        throw createError({ statusCode: 401, statusMessage: 'Ongeldige API-sleutel' })
    }

    const { tablesDB, Query, users } = useServerAppwrite()

    // --- Calculate tomorrow's date range in UTC ---
    // Use Amsterdam timezone so "tomorrow" aligns with local lesson dates
    const nowAmsterdam = dayjs().tz('Europe/Amsterdam')
    const tomorrowStart = nowAmsterdam.add(1, 'day').startOf('day').utc().toISOString()
    const tomorrowEnd = nowAmsterdam.add(1, 'day').endOf('day').utc().toISOString()

    // --- Fetch lessons scheduled for tomorrow ---
    const lessonsRes = await tablesDB.listRows(
        config.public.database,
        'lessons',
        [
            Query.greaterThanEqual('date', tomorrowStart),
            Query.lessThanEqual('date', tomorrowEnd),
            Query.limit(50),
        ]
    )

    const lessons = lessonsRes.rows ?? []

    if (lessons.length === 0) {
        return { lessonsFound: 0, emailsSent: 0 }
    }

    // --- For each lesson, fetch bookings with student data ---
    let emailsSent = 0
    const errors: string[] = []

    for (const lesson of lessons) {
        const fullLesson = await tablesDB.getRow(
            config.public.database,
            'lessons',
            lesson.$id,
            [Query.select(['*', 'bookings.*', 'bookings.students.*'])]
        )

        const bookings = fullLesson.bookings ?? []
        if (bookings.length === 0) continue

        // Format lesson details (same pattern as sendBookingConfirmation)
        const lessonDate = dayjs(fullLesson.date).utc()
        const lessonType = fullLesson.type === 'guest lesson'
            ? `Yin-Yang Yoga door gastdocent ${fullLesson.teacher}`
            : fullLesson.type === 'peachy bum' ? 'Peachy Bum' : 'Hatha Yoga'
        const formattedDate = `${lessonDate.format('dddd D MMMM')} van ${lessonDate.format('H.mm')} tot ${lessonDate.add(1, 'hour').format('H.mm')} uur`
        const address = fullLesson.type === 'peachy bum'
            ? 'Kosboulevard 5, 3059 XZ Rotterdam'
            : 'Emmy van Leersumhof 24a, 3059 LT Rotterdam'

        // Send reminder to each booked student
        for (const booking of bookings) {
            const student = booking.students
            if (!student || typeof student === 'string') continue
            if (!student.email) continue

            // Check if student has opted out of reminder emails
            try {
                const prefs = await users.getPrefs(student.$id)
                if (prefs.reminders === false) {
                    console.log(`[LessonReminder] Skipped ${student.email} (reminders disabled)`)
                    continue
                }
            } catch {
                // If prefs can't be fetched, send the reminder (default: enabled)
            }

            const mail = lessonReminderEmail({
                name: student.name || 'Yogi',
                lessonType,
                lessonDate: formattedDate,
                address,
            })

            try {
                await smtpTransport.sendMail({
                    from: 'Yoga Ravennah <info@ravennah.com>',
                    to: student.email,
                    subject: mail.subject,
                    html: mail.html,
                    text: mail.text,
                })
                emailsSent++
                console.log(`[LessonReminder] Sent to ${student.email} for lesson ${fullLesson.$id}`)
            } catch (err: any) {
                const msg = `Failed to send to ${student.email}: ${err?.message ?? err}`
                console.error(`[LessonReminder] ${msg}`)
                errors.push(msg)
            }

            // Respect SMTP rate limits (Mailtrap: 1 per 10s, production: small delay)
            await new Promise(resolve => setTimeout(resolve, process.env.NODE_ENV !== 'production' ? 10000 : 1000))
        }
    }

    console.log(`[LessonReminder] Done. Lessons: ${lessons.length}, Emails sent: ${emailsSent}, Errors: ${errors.length}`)

    return {
        lessonsFound: lessons.length,
        emailsSent,
        errors: errors.length > 0 ? errors : undefined,
    }
})
