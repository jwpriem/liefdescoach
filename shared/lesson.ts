/**
 * Lesson details shared by the server (emails, notifications) and the client (website, iOS app).
 */

export type LessonKind = { type?: string | null; teacher?: string | null }

export const LESSON_DURATION_MS = 60 * 60 * 1000

const STUDIO_ADDRESS = 'Emmy van Leersumhof 24a, 3059 LT Rotterdam'
const PEACHY_BUM_ADDRESS = 'Kosboulevard 5, 3059 XZ Rotterdam'

const isPeachyBum = (lesson: LessonKind) => lesson.type === 'peachy bum'

export function lessonAddress(lesson: LessonKind): string {
  return isPeachyBum(lesson) ? PEACHY_BUM_ADDRESS : STUDIO_ADDRESS
}

/** The lesson's name as used in emails and notifications. */
export function lessonTypeLabel(lesson: LessonKind): string {
  if (lesson.type === 'guest lesson') return `Yin-Yang Yoga door gastdocent ${lesson.teacher}`
  return isPeachyBum(lesson) ? 'Peachy Bum' : 'Hatha Yoga'
}

const calendarTitleBase = (lesson: LessonKind) => (isPeachyBum(lesson) ? 'Peachy Bum les' : 'Hatha Yoga les')

/** The title of the lesson's calendar entry. */
export function lessonCalendarTitle(lesson: LessonKind): string {
  return `${calendarTitleBase(lesson)} Ravennah`
}

/**
 * A calndr.link "add to calendar" URL. `start` is the stored lesson date: its UTC clock time
 * is the Dutch wall-clock time, which is why the link names the time zone separately.
 */
export function calendarLink(service: string, lesson: LessonKind, start: Date): string {
  const day = start.toISOString().slice(0, 10)
  const time = `${start.getUTCHours()}:${start.getUTCMinutes().toString().padStart(2, '0')}`
  return `https://calndr.link/d/event/?service=${service}&start=${day}%20${time}&title=${calendarTitleBase(lesson)}%20Ravennah&timezone=Europe/Amsterdam&location=${encodeURIComponent(lessonAddress(lesson))}`
}

let amsterdamClock: Intl.DateTimeFormat | undefined

/** How far the Dutch clock is ahead of UTC at the given moment, in milliseconds. */
function amsterdamOffsetMs(moment: Date): number {
  amsterdamClock ??= new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Amsterdam',
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  })
  const parts = Object.fromEntries(amsterdamClock.formatToParts(moment).map((part) => [part.type, Number(part.value)]))
  const clockAsUtc = Date.UTC(parts.year!, parts.month! - 1, parts.day!, parts.hour!, parts.minute!, parts.second!)
  return clockAsUtc - Math.floor(moment.getTime() / 1000) * 1000
}

/**
 * Lesson dates are stored with the Dutch wall-clock time written as UTC ("09:45Z" means 09:45 in the Netherlands).
 * This returns the real moment the lesson starts, for anything that needs an absolute time (a calendar event).
 * The offset is read at a first guess of that moment, so the hours around a clock change come out right.
 * For the hour that does not exist (spring) and the hour that happens twice (autumn) the result is one of the
 * two possible moments; which one is arbitrary.
 */
export function lessonStartInstant(date: Date | string): Date {
  const clockTime = new Date(date).getTime()
  const guess = clockTime - amsterdamOffsetMs(new Date(clockTime))
  return new Date(clockTime - amsterdamOffsetMs(new Date(guess)))
}
