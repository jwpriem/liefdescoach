import { createError } from 'h3'
import { eq, and, isNull, gt } from 'drizzle-orm'
import { lessons, bookings, students, credits } from '../database/schema'

export default defineEventHandler(async (event) => {
    await requireAuth(event)

    const body = await readBody(event)

    if (!body?.email || typeof body.email !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'E-mail is verplicht' })
    }
    if (!body?.lessonId || typeof body.lessonId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'lessonId is verplicht' })
    }

    // Fetch lesson
    const lessonRows = await db.select().from(lessons).where(eq(lessons.id, body.lessonId)).limit(1)
    if (lessonRows.length === 0) return

    const lesson = lessonRows[0]

    // Fetch bookings with student data
    const bookingRows = await db
        .select({
            id: bookings.id,
            studentName: students.name,
        })
        .from(bookings)
        .leftJoin(students, eq(bookings.studentId, students.id))
        .where(eq(bookings.lessonId, body.lessonId))

    const bookingsArr = bookingRows.map((b) => ({
        name: b.studentName ?? 'Onbekend',
    }))

    const lessonDate = new Date(lesson.date!)
    const lessontype = lesson.type === 'guest lesson'
        ? `Yin-Yang Yoga door gastdocent ${lesson.teacher}`
        : lesson.type === 'peachy bum' ? 'Peachy Bum' : 'Hatha Yoga'
    const address = lesson.type === 'peachy bum'
        ? 'Kosboulevard 5, 3059 XZ Rotterdam'
        : 'Emmy van Leersumhof 24a, 3059 LT Rotterdam'
    const calendarTitle = lesson.type === 'peachy bum' ? 'Peachy Bum les' : 'Hatha Yoga les'

    const calendarLink = (stream: string) =>
        `https://calndr.link/d/event/?service=${stream}&start=${formatISODate(lessonDate)}%20${formatHour(lessonDate)}:${formatMinutes(lessonDate)}&title=${calendarTitle}%20Ravennah&timezone=Europe/Amsterdam&location=${encodeURIComponent(address)}`

    const formattedDate = formatLessonDate(lessonDate)
    const spots = MAX_LESSON_CAPACITY - bookingRows.length

    const studentMail = bookingStudentEmail({
        name: body.name,
        lessonType: lessontype,
        lessonDate: formattedDate,
        calendarLinks: {
            apple: calendarLink('apple'),
            google: calendarLink('gmail'),
            outlook: calendarLink('outlook'),
        },
    })

    const adminMail = bookingAdminEmail({
        name: body.name,
        email: body.email,
        lessonType: lessontype,
        lessonDate: formattedDate,
        spots,
        bookings: bookingsArr,
    })

    const emails = [
        { label: 'student', to: body.email, ...studentMail },
        { label: 'admin', to: 'info@ravennah.com', ...adminMail },
    ]

    await Promise.allSettled(
        emails.map(async (mail) => {
            try {
                const result = await smtpTransport.sendMail({
                    from: 'Yoga Ravennah <info@ravennah.com>',
                    to: mail.to,
                    subject: mail.subject,
                    html: mail.html,
                    text: mail.text,
                })
                console.log(`[BookingConfirmation] ${mail.label} email sent:`, result?.accepted)
            } catch (err: any) {
                console.error(`[BookingConfirmation] ${mail.label} email failed:`, err?.message ?? err)
            }
        })
    )

    // Send push notification to admin
    try {
        await sendPushToAdmins({
            title: 'Nieuwe boeking',
            body: `${body.name} heeft ${lessontype} geboekt op ${formattedDate}`,
            url: '/account',
        })
    } catch (err: any) {
        console.error('[BookingConfirmation] Admin push failed:', err?.message ?? err)
    }

    // Check if student has zero remaining credits — alert admin
    try {
        const studentRows = await db
            .select({ id: students.id })
            .from(students)
            .where(eq(students.email, body.email))
            .limit(1)

        if (studentRows.length > 0) {
            const now = new Date()
            const availableCredits = await db
                .select()
                .from(credits)
                .where(
                    and(
                        eq(credits.studentId, studentRows[0].id),
                        isNull(credits.bookingId),
                        gt(credits.validTo, now)
                    )
                )
                .limit(1)

            if (availableCredits.length === 0) {
                await sendPushToAdmins({
                    title: 'Credits op',
                    body: `${body.name} heeft geen credits meer`,
                    url: '/account',
                })
            }
        }
    } catch (err: any) {
        console.error('[BookingConfirmation] Credit check push failed:', err?.message ?? err)
    }

    setResponseStatus(event, 202)
})
