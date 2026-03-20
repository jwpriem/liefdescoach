/**
 * Server-side date formatting using native Intl API — no dayjs dependency needed.
 */

const nlWeekday = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', timeZone: 'UTC' })
const nlDay = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', timeZone: 'UTC' })
const nlMonth = new Intl.DateTimeFormat('nl-NL', { month: 'long', timeZone: 'UTC' })

/**
 * Format a date as "donderdag 5 januari" in Dutch (UTC).
 */
export function formatDutchDate(date: Date): string {
    const weekday = nlWeekday.format(date)
    const day = nlDay.format(date)
    const month = nlMonth.format(date)
    return `${weekday} ${day} ${month}`
}

/**
 * Format hours and minutes as "9.45" (Dutch style, UTC).
 */
export function formatTime(date: Date): string {
    const h = date.getUTCHours()
    const m = date.getUTCMinutes().toString().padStart(2, '0')
    return `${h}.${m}`
}

/**
 * Format a lesson date as "donderdag 5 januari van 9.45 tot 10.45 uur" (UTC).
 */
export function formatLessonDate(date: Date): string {
    const datePart = formatDutchDate(date)
    const startTime = formatTime(date)
    const endDate = new Date(date.getTime() + 60 * 60 * 1000) // +1 hour
    const endTime = formatTime(endDate)
    return `${datePart} van ${startTime} tot ${endTime} uur`
}

/**
 * Format date as "YYYY-MM-DD" (UTC).
 */
export function formatISODate(date: Date): string {
    return date.toISOString().slice(0, 10)
}

/**
 * Format hour as string, e.g. "9" (UTC).
 */
export function formatHour(date: Date): string {
    return String(date.getUTCHours())
}

/**
 * Format minutes as "mm", e.g. "45" (UTC).
 */
export function formatMinutes(date: Date): string {
    return date.getUTCMinutes().toString().padStart(2, '0')
}

/**
 * Get tomorrow's start and end in a given timezone, returned as UTC Date objects.
 */
export function getTomorrowRange(timezone: string): { start: Date; end: Date } {
    const now = new Date()

    // Get tomorrow's date string in the target timezone using en-CA (YYYY-MM-DD format)
    // Adding 24h is sufficient to land on "tomorrow" in any timezone
    const tomorrowStr = new Intl.DateTimeFormat('en-CA', { timeZone: timezone })
        .format(new Date(now.getTime() + 24 * 60 * 60 * 1000))

    const [year, month, day] = tomorrowStr.split('-').map(Number)

    // Use noon UTC as anchor to determine the timezone offset on that day
    // (noon avoids DST transition ambiguity which only occurs near midnight)
    const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
    }).formatToParts(noonUtc)

    const h = parseInt(parts.find(p => p.type === 'hour')!.value) % 24
    const m = parseInt(parts.find(p => p.type === 'minute')!.value)
    const s = parseInt(parts.find(p => p.type === 'second')!.value)

    // offsetMs = how many ms the target timezone is ahead of UTC
    const offsetMs = ((h - 12) * 3600 + m * 60 + s) * 1000

    // Midnight in target timezone = UTC midnight minus the offset
    const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMs)
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)

    return { start, end }
}
