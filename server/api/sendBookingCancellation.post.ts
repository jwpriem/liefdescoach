import { createError, getRequestIP } from 'h3'
import { eq, and } from 'drizzle-orm'
import { lessons, bookings, students } from '../database/schema'

const MAX_IP_REQUESTS = 10
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const requestsByIP = new Map<string, { count: number; firstRequest: number }>()

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)

    // Rate limiting
    const ip = getRequestIP(event) || 'unknown'
    const now = Date.now()
    const ipData = requestsByIP.get(ip)
    if (ipData) {
        if (now - ipData.firstRequest > WINDOW_MS) {
            requestsByIP.set(ip, { count: 1, firstRequest: now })
        } else if (ipData.count >= MAX_IP_REQUESTS) {
            throw createError({ statusCode: 429, statusMessage: 'Te veel aanvragen. Probeer het later opnieuw.' })
        } else {
            ipData.count++
        }
    } else {
        requestsByIP.set(ip, { count: 1, firstRequest: now })
    }

    const body = await readBody(event)

    if (!body?.email || typeof body.email !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'E-mail is verplicht' })
    }

    const email = body.email.trim().toLowerCase()
    const isAdmin = user.labels.includes('admin')
    if (email !== user.email.toLowerCase() && !isAdmin) {
        throw createError({ statusCode: 403, statusMessage: 'Geen toegang' })
    }
    if (!body?.lessonId || typeof body.lessonId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'lessonId is verplicht' })
    }

    // Fetch student to ensure they exist and get their verified name
    const studentRows = await db
        .select()
        .from(students)
        .where(eq(students.email, email))
        .limit(1)

    if (studentRows.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'Student niet gevonden' })
    }
    const student = studentRows[0]

    // Verify that the student NO LONGER has a booking for this lesson (since it was just cancelled)
    // Or if we can't be sure about the order, at least we know they SHOULD have had one.
    // Actually, when this is called, the booking is already deleted in cancelBooking.post.ts.
    // So we can't easily verify the booking existence here unless we trust the client or change the flow.
    // However, we can at least use the student's name from DB.

    const lessonRows = await db.select().from(lessons).where(eq(lessons.id, body.lessonId)).limit(1)
    if (lessonRows.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'Les niet gevonden' })
    }

    const lesson = lessonRows[0]

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

    const formattedDate = formatLessonDate(lessonDate)
    const spots = lesson.maxSpots - bookingRows.length

    const studentMail = cancellationStudentEmail({
        name: student.name,
        lessonType: lessontype,
        lessonDate: formattedDate,
    })

    const adminMail = cancellationAdminEmail({
        name: student.name,
        email: student.email!,
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
                console.log(`[BookingCancellation] ${mail.label} email sent:`, result?.accepted)
            } catch (err: any) {
                console.error(`[BookingCancellation] ${mail.label} email failed:`, err?.message ?? err)
            }
        })
    )

    // Send push notification to admin
    try {
        await sendPushToAdmins({
            title: 'Annulering',
            body: `${student.name} heeft ${lessontype} geannuleerd op ${formattedDate}`,
            url: '/account',
        })
    } catch (err: any) {
        console.error('[BookingCancellation] Admin push failed:', err?.message ?? err)
    }

    setResponseStatus(event, 202)
})
