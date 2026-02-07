import { createError } from 'h3'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import 'dayjs/locale/nl'

dayjs.extend(utc)
dayjs.locale('nl')

export default defineEventHandler(async (event) => {
    await requireAuth(event)
    const config = useRuntimeConfig()
    const { tablesDB, Query } = useServerAppwrite()

    const body = await readBody(event)

    if (!body?.email || typeof body.email !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'E-mail is verplicht' })
    }
    if (!body?.lessonId || typeof body.lessonId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'lessonId is verplicht' })
    }

    // Fetch lesson with bookings and student names
    const lesson = await tablesDB.getRow(
        config.public.database,
        'lessons',
        body.lessonId,
        [Query.select(['*', 'bookings.*', 'bookings.students.*'])]
    )

    const bookings = lesson.bookings ?? []
    const unresolvedIds = bookings
        .filter((b: any) => typeof b.students === 'string')
        .map((b: any) => b.students)

    const { users } = useServerAppwrite()
    const nameMap: Record<string, string> = {}
    for (const uid of unresolvedIds) {
        try {
            const u = await users.get(uid)
            nameMap[uid] = u.name || u.email || 'Onbekend'
        } catch {
            nameMap[uid] = 'Onbekend'
        }
    }

    const bookingsArr = bookings.map((b: any) => ({
        name: typeof b.students === 'string'
            ? (nameMap[b.students] ?? 'Onbekend')
            : (b.students?.name ?? 'Onbekend')
    }))

    const lessonDate = dayjs(lesson.date).utc()
    const lessontype = lesson.type === 'guest lesson'
        ? `Yin-Yang Yoga door gastdocent ${lesson.teacher}`
        : lesson.type === 'peachy bum' ? 'Peachy Bum' : 'Hatha Yoga'

    const formattedDate = `${lessonDate.format('dddd D MMMM')} van ${lessonDate.format('H.mm')} tot ${lessonDate.add(1, 'hour').format('H.mm')} uur`
    const spots = MAX_LESSON_CAPACITY - (lesson.bookings?.length ?? 0)

    // 1. Email to the student (no participants, no spots)
    const studentMail = cancellationStudentEmail({
        name: body.name,
        lessonType: lessontype,
        lessonDate: formattedDate,
    })

    // 2. Email to admin (with remaining participants, spots, student info)
    const adminMail = cancellationAdminEmail({
        name: body.name,
        email: body.email,
        lessonType: lessontype,
        lessonDate: formattedDate,
        spots,
        bookings: bookingsArr,
    })

    // Send emails sequentially with a small delay to respect SMTP rate limits
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
        // Mailtrap free plan: max 1 email per 10 seconds
        await new Promise(resolve => setTimeout(resolve, 10000))
    }

    setResponseStatus(event, 202)
})
