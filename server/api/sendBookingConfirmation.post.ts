import { createError } from 'h3'
import { eq, and, isNull, gt } from 'drizzle-orm'
import { lessons, bookings, students, credits } from '../database/schema'

const MAX_USER_REQUESTS = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const requestsByUser = new Map<string, { count: number; firstRequest: number }>()
let lastCleanup = 0

function lazyCleanup(now: number) {
    if (requestsByUser.size > 1000 && now - lastCleanup > 60000) {
        lastCleanup = now
        for (const [key, data] of requestsByUser.entries()) {
            if (now - data.firstRequest > RATE_LIMIT_WINDOW_MS) requestsByUser.delete(key)
        }
    }
}

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)
    const body = await readBody(event)
    if (!body?.lessonId || typeof body.lessonId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'lessonId is verplicht' })
    }

    const isAdmin = user.labels.includes('admin')
    const name = isAdmin && body.name ? body.name : user.name
    const email = isAdmin && body.email ? body.email.trim().toLowerCase() : user.email.toLowerCase()

    const now = Date.now()
    lazyCleanup(now)
    const userData = requestsByUser.get(user.$id)
    if (userData) {
        if (now - userData.firstRequest > RATE_LIMIT_WINDOW_MS) {
            requestsByUser.set(user.$id, { count: 1, firstRequest: now })
        } else if (userData.count >= MAX_USER_REQUESTS) {
            throw createError({ statusCode: 429, statusMessage: 'Te veel aanvragen. Probeer het later opnieuw.' })
        } else {
            userData.count++
        }
    } else {
        requestsByUser.set(user.$id, { count: 1, firstRequest: now })
    }

    // Verify booking exists to prevent spamming admin for lessons user isn't in
    const targetStudentRows = await db.select({ id: students.id }).from(students).where(eq(students.email, email)).limit(1)
    if (targetStudentRows.length === 0) return
    const targetStudentId = targetStudentRows[0].id

    const bookingExists = await db
        .select({ id: bookings.id })
        .from(bookings)
        .where(and(eq(bookings.lessonId, body.lessonId), eq(bookings.studentId, targetStudentId)))
        .limit(1)

    if (bookingExists.length === 0) {
        throw createError({ statusCode: 403, statusMessage: 'Geen actieve boeking gevonden' })
    }

    // Fetch lesson and send emails in background
    const lessonRows = await db.select().from(lessons).where(eq(lessons.id, body.lessonId)).limit(1)
    if (lessonRows.length === 0) return
    const lesson = lessonRows[0]

    event.waitUntil(Promise.resolve().then(async () => {
        try {
            const bookingRows = await db
                .select({ id: bookings.id, studentName: students.name })
                .from(bookings)
                .leftJoin(students, eq(bookings.studentId, students.id))
                .where(eq(bookings.lessonId, body.lessonId))

            const bookingsArr = bookingRows.map((b) => ({ name: b.studentName ?? 'Onbekend' }))
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
            const spots = lesson.maxSpots - bookingRows.length

            const studentMail = bookingStudentEmail({
                name,
                lessonType: lessontype,
                lessonDate: formattedDate,
                calendarLinks: { apple: calendarLink('apple'), google: calendarLink('gmail'), outlook: calendarLink('outlook') },
            })

            const adminMail = bookingAdminEmail({
                name, email, lessonType: lessontype, lessonDate: formattedDate, spots, bookings: bookingsArr,
            })

            await Promise.allSettled([
                smtpTransport.sendMail({ from: 'Yoga Ravennah <info@ravennah.com>', to: email, ...studentMail }),
                smtpTransport.sendMail({ from: 'Yoga Ravennah <info@ravennah.com>', to: 'info@ravennah.com', ...adminMail }),
            ])

            await sendPushToAdmins({
                title: 'Nieuwe boeking',
                body: `${name} heeft ${lessontype} geboekt op ${formattedDate}`,
                url: '/account',
            })

            const availableCredits = await db
                .select()
                .from(credits)
                .where(and(eq(credits.studentId, targetStudentId), isNull(credits.bookingId), gt(credits.validTo, new Date())))
                .limit(1)

            if (availableCredits.length === 0) {
                await sendPushToAdmins({ title: 'Credits op', body: `${name} heeft geen credits meer`, url: '/account' })
            }
        } catch (err: any) {
            console.error(`[BookingConfirmation] Error:`, err?.message ?? err)
        }
    }))

    setResponseStatus(event, 202)
})
