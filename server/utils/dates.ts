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
    // Get "now" in the target timezone
    const nowInTZ = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }))
    // Tomorrow at midnight in that timezone
    const tomorrowLocal = new Date(nowInTZ.getFullYear(), nowInTZ.getMonth(), nowInTZ.getDate() + 1, 0, 0, 0, 0)
    const endLocal = new Date(nowInTZ.getFullYear(), nowInTZ.getMonth(), nowInTZ.getDate() + 1, 23, 59, 59, 999)

    // Convert back to UTC by finding the offset
    const offsetMs = tomorrowLocal.getTime() - new Date(tomorrowLocal.toLocaleString('en-US', { timeZone: 'UTC' })).getTime()

    return {
        start: new Date(tomorrowLocal.getTime() - offsetMs),
        end: new Date(endLocal.getTime() - offsetMs),
    }
}
