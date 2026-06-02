import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { lessons, bookings, students } from '../database/schema'

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

            const formattedDate = formatLessonDate(lessonDate)
            const spots = lesson.maxSpots - bookingRows.length

            const studentMail = cancellationStudentEmail({ name, lessonType: lessontype, lessonDate: formattedDate })
            const adminMail = cancellationAdminEmail({ name, email, lessonType: lessontype, lessonDate: formattedDate, spots, bookings: bookingsArr })

            await Promise.allSettled([
                smtpTransport.sendMail({ from: 'Yoga Ravennah <info@ravennah.com>', to: email, ...studentMail }),
                smtpTransport.sendMail({ from: 'Yoga Ravennah <info@ravennah.com>', to: 'info@ravennah.com', ...adminMail }),
            ])

            await sendPushToAdmins({
                title: 'Annulering',
                body: `${name} heeft ${lessontype} geannuleerd op ${formattedDate}`,
                url: '/account',
            })
        } catch (err: any) {
            console.error(`[BookingCancellation] Error:`, err?.message ?? err)
        }
    }))

    setResponseStatus(event, 202)
})
