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
    const address = lesson.type === 'peachy bum'
        ? 'Kosboulevard 5, 3059 XZ Rotterdam'
        : 'Emmy van Leersumhof 24a, 3059 LT Rotterdam'
    const calendarTitle = lesson.type === 'peachy bum' ? 'Peachy Bum les' : 'Hatha Yoga les'

    const calendarLink = (stream: string) =>
        `https://calndr.link/d/event/?service=${stream}&start=${lessonDate.format('YYYY-MM-DD')}%20${lessonDate.format('H')}:${lessonDate.format('mm')}&title=${calendarTitle}%20Ravennah&timezone=Europe/Amsterdam&location=${encodeURIComponent(address)}`

    const formattedDate = `${lessonDate.format('dddd D MMMM')} van ${lessonDate.format('H.mm')} tot ${lessonDate.add(1, 'hour').format('H.mm')} uur`
    const spots = MAX_LESSON_CAPACITY - (lesson.bookings?.length ?? 0)

    // 1. Email to the student (no participants, no spots)
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

    // 2. Email to admin (with participants, spots, student info)
    const adminMail = bookingAdminEmail({
        name: body.name,
        email: body.email,
        lessonType: lessontype,
        lessonDate: formattedDate,
        spots,
        bookings: bookingsArr,
    })

    // Send both emails independently — one failure should not block the other
    const results = await Promise.allSettled([
        smtpTransport.sendMail({
            from: 'Yoga Ravennah <info@ravennah.com>',
            to: body.email,
            subject: studentMail.subject,
            html: studentMail.html,
            text: studentMail.text,
        }),
        smtpTransport.sendMail({
            from: 'Yoga Ravennah <info@ravennah.com>',
            to: 'info@ravennah.com',
            subject: adminMail.subject,
            html: adminMail.html,
            text: adminMail.text,
        }),
    ])

    const failures = results.filter(r => r.status === 'rejected')
    if (failures.length) {
        console.error('Email send failures:', failures.map(f => (f as PromiseRejectedResult).reason))
    }

    setResponseStatus(event, 202)
})
