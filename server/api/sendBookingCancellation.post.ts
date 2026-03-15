import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import 'dayjs/locale/nl.js'
import { lessons, bookings, students } from '../database/schema'

dayjs.extend(utc)
dayjs.locale('nl')

export default defineEventHandler(async (event) => {
    await requireAuth(event)
    const db = useDB()

    const body = await readBody(event)

    if (!body?.email || typeof body.email !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'E-mail is verplicht' })
    }
    if (!body?.lessonId || typeof body.lessonId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'lessonId is verplicht' })
    }

    const lessonRows = await db.select().from(lessons).where(eq(lessons.id, body.lessonId)).limit(1)
    if (lessonRows.length === 0) return

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

    const lessonDate = dayjs(lesson.date).utc()
    const lessontype = lesson.type === 'guest lesson'
        ? `Yin-Yang Yoga door gastdocent ${lesson.teacher}`
        : lesson.type === 'peachy bum' ? 'Peachy Bum' : 'Hatha Yoga'

    const formattedDate = `${lessonDate.format('dddd D MMMM')} van ${lessonDate.format('H.mm')} tot ${lessonDate.add(1, 'hour').format('H.mm')} uur`
    const spots = MAX_LESSON_CAPACITY - bookingRows.length

    const studentMail = cancellationStudentEmail({
        name: body.name,
        lessonType: lessontype,
        lessonDate: formattedDate,
    })

    const adminMail = cancellationAdminEmail({
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

    for (const mail of emails) {
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
        await new Promise(resolve => setTimeout(resolve, 10000))
    }

    setResponseStatus(event, 202)
})
