/**
 * Seeds the lessons collection with weekly Sunday 09:45 (Amsterdam time) hatha yoga
 * lessons for the next 12 weeks, plus 3 guest lessons with teacher Bo Bol.
 *
 * Usage:
 *   yarn tsx scripts/seed-lessons.ts                # default 12 weeks
 *   yarn tsx scripts/seed-lessons.ts --weeks 8      # custom weeks
 *
 * Required env vars: NUXT_PUBLIC_PROJECT, NUXT_APPWRITE_KEY, NUXT_PUBLIC_DATABASE
 */

import { createAppwriteClient, getDatabaseId } from './appwrite-client'

/** Returns the next Sunday at 09:45 Amsterdam time from a given date */
function getNextSunday(from: Date): Date {
    const d = new Date(from)
    const day = d.getDay() // 0=Sunday
    const daysUntilSunday = day === 0 ? 7 : 7 - day
    d.setDate(d.getDate() + daysUntilSunday)
    return d
}

/** Converts a date + time in Europe/Amsterdam to a UTC ISO string */
function amsterdamToUTC(year: number, month: number, day: number, hour: number, minute: number): string {
    // Build an Amsterdam-local datetime string and use Intl to resolve the offset
    const localStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`

    // Create date in Amsterdam timezone by computing the offset
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Amsterdam',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
    })

    // Parse the target date as UTC, then figure out the Amsterdam offset
    const targetUTC = new Date(`${localStr}Z`)
    const amsParts = formatter.formatToParts(targetUTC)
    const amsHour = parseInt(amsParts.find(p => p.type === 'hour')!.value, 10)

    // Offset = Amsterdam hour - UTC hour (handling day boundary)
    let offsetHours = amsHour - targetUTC.getUTCHours()
    if (offsetHours > 12) offsetHours -= 24
    if (offsetHours < -12) offsetHours += 24

    // Subtract the offset to get the real UTC time for the Amsterdam local time
    const realUTC = new Date(targetUTC.getTime() - offsetHours * 60 * 60 * 1000)
    return realUTC.toISOString()
}

async function main() {
    const { databases, ID } = createAppwriteClient()
    const dbId = getDatabaseId()

    const weeksArg = process.argv.indexOf('--weeks')
    const weeks = weeksArg !== -1 && process.argv[weeksArg + 1]
        ? parseInt(process.argv[weeksArg + 1], 10)
        : 12

    const now = new Date()
    let sunday = getNextSunday(now)

    console.log(`Seeding ${weeks} weekly hatha yoga lessons (Sundays 09:45 AMS)...`)

    for (let i = 0; i < weeks; i++) {
        const year = sunday.getFullYear()
        const month = sunday.getMonth() + 1
        const day = sunday.getDate()

        const dateUTC = amsterdamToUTC(year, month, day, 9, 45)

        const doc = await databases.createDocument(dbId, 'lessons', ID.unique(), {
            date: dateUTC,
            type: 'hatha yoga',
            teacher: 'Ravennah',
        })

        console.log(`  [${i + 1}/${weeks}] ${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 09:45 AMS -> ${dateUTC}  (${doc.$id})`)

        // Move to next Sunday
        sunday.setDate(sunday.getDate() + 7)
    }

    // --- 3 guest lessons with Bo Bol on the first 3 Sundays at 11:15 ---
    console.log(`\nSeeding 3 guest lessons (Bo Bol, Sundays 11:15 AMS)...`)

    let guestSunday = getNextSunday(now)

    for (let i = 0; i < 3; i++) {
        const year = guestSunday.getFullYear()
        const month = guestSunday.getMonth() + 1
        const day = guestSunday.getDate()

        const dateUTC = amsterdamToUTC(year, month, day, 11, 15)

        const doc = await databases.createDocument(dbId, 'lessons', ID.unique(), {
            date: dateUTC,
            type: 'guest lesson',
            teacher: 'Bo Bol',
        })

        console.log(`  [${i + 1}/3] ${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 11:15 AMS -> ${dateUTC}  (${doc.$id})`)

        guestSunday.setDate(guestSunday.getDate() + 7)
    }

    console.log(`\nDone! Created ${weeks + 3} lessons total.`)
}

main().catch((err) => {
    console.error('Seed failed:', err.message ?? err)
    process.exit(1)
})
