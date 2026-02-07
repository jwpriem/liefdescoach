import { ServerClient } from 'postmark'
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
    const client = new ServerClient(config.postmark)

    const body = await readBody(event)

    if (!body?.email || typeof body.email !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'E-mail is verplicht' })
    }
    if (!body?.lessonId || typeof body.lessonId !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'lessonId is verplicht' })
    }

    // Fetch lesson with bookings and student names using server API key
    const lesson = await tablesDB.getRow(
        config.public.database,
        'lessons',
        body.lessonId,
        [Query.select(['*', 'bookings.*', 'bookings.students.*'])]
    )

    // Resolve student names: the relationship may return an object or a raw ID string
    const bookings = lesson.bookings ?? []
    const unresolvedIds = bookings
        .filter((b: any) => typeof b.students === 'string')
        .map((b: any) => b.students)

    // Look up unresolved student names from Auth users
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

    const templateData = {
        email: body.email,
        new_booking_name: body.name,
        lessontype,
        lessondate: `${lessonDate.format('dddd D MMMM')} van ${lessonDate.format('H.mm')} tot ${lessonDate.add(1, 'hour').format('H.mm')} uur`,
        spots: MAX_LESSON_CAPACITY - (lesson.bookings?.length ?? 0),
        bookings: bookingsArr,
        calendar_link_apple: calendarLink('apple'),
        calendar_link_gmail: calendarLink('gmail'),
        calendar_link_outlook: calendarLink('outlook')
    }

    await client.sendEmailWithTemplate({
        "From": "info@ravennah.com",
        "To": "info@ravennah.com",
        "TemplateAlias": "lesson-cancel",
        "TemplateModel": templateData
    })

    setResponseStatus(event, 202)
})
