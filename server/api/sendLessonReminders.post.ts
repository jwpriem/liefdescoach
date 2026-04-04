import { createError } from 'h3'
import crypto from 'node:crypto'
import { and, gte, lte, eq } from 'drizzle-orm'
import { lessons, bookings, students } from '../database/schema'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()

    // Auth: verify cron secret
    const apiKey = getHeader(event, 'x-api-key')
    if (!config.cronSecret || !apiKey) {
        throw createError({ statusCode: 401, statusMessage: 'Ongeldige API-sleutel' })
    }

    const keyBuffer = Buffer.from(apiKey)
    const secretBuffer = Buffer.from(config.cronSecret)

    if (keyBuffer.length !== secretBuffer.length || !crypto.timingSafeEqual(keyBuffer, secretBuffer)) {
        throw createError({ statusCode: 401, statusMessage: 'Ongeldige API-sleutel' })
    }


    // Calculate tomorrow's date range
    const { start: tomorrowStart, end: tomorrowEnd } = getTomorrowRange('Europe/Amsterdam')

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
    let pushSent = 0
    const errors: string[] = []

    for (const lesson of lessonRows) {
        // Fetch bookings with student data
        const bookingRows = await db
            .select({
                studentId: students.id,
                studentName: students.name,
                studentEmail: students.email,
                reminders: students.reminders,
                pushNotifications: students.pushNotifications,
            })
            .from(bookings)
            .innerJoin(students, eq(bookings.studentId, students.id))
            .where(eq(bookings.lessonId, lesson.id))

        if (bookingRows.length === 0) continue

        const lessonDate = new Date(lesson.date!)
        const lessonType = lesson.type === 'guest lesson'
            ? `Yin-Yang Yoga door gastdocent ${lesson.teacher}`
            : lesson.type === 'peachy bum' ? 'Peachy Bum' : 'Hatha Yoga'
        const formattedDate = formatLessonDate(lessonDate)
        const address = lesson.type === 'peachy bum'
            ? 'Kosboulevard 5, 3059 XZ Rotterdam'
            : 'Emmy van Leersumhof 24a, 3059 LT Rotterdam'

        for (const student of bookingRows) {
            if (!student.studentEmail) continue

            // Send email reminder (if opted in)
            if (student.reminders !== false) {
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
                    console.log(`[LessonReminder] Email sent to ${student.studentEmail} for lesson ${lesson.id}`)
                } catch (err: any) {
                    const msg = `Failed to send email to ${student.studentEmail}: ${err?.message ?? err}`
                    console.error(`[LessonReminder] ${msg}`)
                    errors.push(msg)
                }
            } else {
                console.log(`[LessonReminder] Skipped email for ${student.studentEmail} (reminders disabled)`)
            }

            // Send push reminder (if opted in)
            if (student.pushNotifications) {
                try {
                    const sent = await sendPushToStudent(student.studentId, {
                        title: 'Morgen yoga!',
                        body: `Je hebt morgen ${lessonType} — tot dan!`,
                        url: '/lessen',
                    })
                    pushSent += sent
                    console.log(`[LessonReminder] Push sent to ${student.studentEmail} (${sent} devices)`)
                } catch (err: any) {
                    console.error(`[LessonReminder] Push failed for ${student.studentEmail}:`, err?.message ?? err)
                }
            }

            await new Promise(resolve => setTimeout(resolve, 100))
        }
    }

    console.log(`[LessonReminder] Done. Lessons: ${lessonRows.length}, Emails sent: ${emailsSent}, Push sent: ${pushSent}, Errors: ${errors.length}`)

    return {
        lessonsFound: lessonRows.length,
        emailsSent,
        pushSent,
        errors: errors.length > 0 ? errors : undefined,
    }
})
