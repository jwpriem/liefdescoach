/**
 * Seeds 2 years of historical lessons with realistic bookings.
 *
 * TEST ENVIRONMENTS ONLY — refuses to run if NUXT_PUBLIC_PROJECT looks like production.
 * Set SEED_ALLOW=1 to confirm you want to run this.
 *
 * - ~48 lessons per year (weekly on Sundays 09:45 AMS, skipping ~4 weeks for holidays)
 * - Each lesson gets a weighted random number of bookings (3–9)
 *   Distribution: 9→35%, 8→20%, 7→25%, 6→10%, 5→5%, 4→3%, 3→2%
 * - Bookings are spread unevenly across students (some students book much more)
 *
 * Usage:
 *   SEED_ALLOW=1 yarn tsx scripts/seed-history.ts
 *
 * Required env vars: NUXT_PUBLIC_PROJECT, NUXT_APPWRITE_KEY, NUXT_PUBLIC_DATABASE, SEED_ALLOW
 */

import { createAppwriteClient, getDatabaseId } from './appwrite-client'
import { Query } from 'node-appwrite'

// ─── Production guard ───
const PRODUCTION_INDICATORS = [
    '67b36',  // known production project prefix
]

function checkNotProduction() {
    const project = process.env.NUXT_PUBLIC_PROJECT ?? ''

    if (PRODUCTION_INDICATORS.some(p => project.startsWith(p))) {
        console.error('ERROR: This looks like a production project ID. Refusing to seed test data.')
        console.error('This script is only for test/dev environments.')
        process.exit(1)
    }

    if (process.env.SEED_ALLOW !== '1') {
        console.error('ERROR: You must set SEED_ALLOW=1 to confirm this is a test environment.')
        console.error('Usage: SEED_ALLOW=1 yarn tsx scripts/seed-history.ts')
        process.exit(1)
    }
}

// ─── Booking count distribution ───
// 9→35%, 8→20%, 7→25%, 6→10%, 5→5%, 4→3%, 3→2%
const BOOKING_DISTRIBUTION = [
    { count: 9, weight: 35 },
    { count: 8, weight: 20 },
    { count: 7, weight: 25 },
    { count: 6, weight: 10 },
    { count: 5, weight: 5 },
    { count: 4, weight: 3 },
    { count: 3, weight: 2 },
]

function getWeightedBookingCount(): number {
    const totalWeight = BOOKING_DISTRIBUTION.reduce((s, d) => s + d.weight, 0)
    let rand = Math.random() * totalWeight
    for (const entry of BOOKING_DISTRIBUTION) {
        rand -= entry.weight
        if (rand <= 0) return entry.count
    }
    return BOOKING_DISTRIBUTION[0].count
}

// ─── Seeded random for reproducibility ───
function seededRandom(seed: number): () => number {
    let s = seed
    return () => {
        s = (s * 1664525 + 1013904223) & 0x7fffffff
        return s / 0x7fffffff
    }
}

// ─── Date helpers (reuse from seed-lessons.ts) ───
function amsterdamToUTC(year: number, month: number, day: number, hour: number, minute: number): string {
    const localStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Amsterdam',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
    })
    const targetUTC = new Date(`${localStr}Z`)
    const amsParts = formatter.formatToParts(targetUTC)
    const amsHour = parseInt(amsParts.find(p => p.type === 'hour')!.value, 10)
    let offsetHours = amsHour - targetUTC.getUTCHours()
    if (offsetHours > 12) offsetHours -= 24
    if (offsetHours < -12) offsetHours += 24
    const realUTC = new Date(targetUTC.getTime() - offsetHours * 60 * 60 * 1000)
    return realUTC.toISOString()
}

function getPreviousSunday(from: Date): Date {
    const d = new Date(from)
    const day = d.getDay()
    d.setDate(d.getDate() - day) // go back to last Sunday
    return d
}

// ─── Holiday skip logic (approx 4 weeks/year) ───
function isHolidayWeek(date: Date): boolean {
    const month = date.getMonth() // 0-based
    const day = date.getDate()

    // Skip last week of Dec + first week of Jan
    if (month === 11 && day >= 24) return true
    if (month === 0 && day <= 7) return true

    // Skip 1 week in Aug (summer break, around week 2)
    if (month === 7 && day >= 8 && day <= 14) return true

    // Skip 1 week around Easter (approx mid-April)
    if (month === 3 && day >= 10 && day <= 16) return true

    return false
}

// ─── Main ───
async function main() {
    checkNotProduction()

    const { databases, users, ID } = createAppwriteClient()
    const dbId = getDatabaseId()

    console.log(`Database: ${dbId}`)

    // Fetch all non-archived students
    let allUsers: any[] = []
    let offset = 0
    while (true) {
        const res = await users.list([Query.limit(100), Query.offset(offset)])
        allUsers = allUsers.concat(res.users)
        if (res.users.length < 100) break
        offset += 100
    }

    const activeStudents = allUsers.filter(u => u.prefs?.archive !== true)

    if (activeStudents.length < 3) {
        console.error('ERROR: Need at least 3 active students to seed bookings.')
        process.exit(1)
    }

    console.log(`Found ${activeStudents.length} active students`)

    // Assign weights to students (uneven distribution)
    // Top 30% of students get 3x weight, next 30% get 2x, rest get 1x
    const rng = seededRandom(42)
    const shuffled = [...activeStudents].sort(() => rng() - 0.5)
    const studentWeights: { user: any; weight: number }[] = shuffled.map((user, idx) => {
        const pct = idx / shuffled.length
        let weight: number
        if (pct < 0.3) weight = 3
        else if (pct < 0.6) weight = 2
        else weight = 1
        return { user, weight }
    })

    function pickStudents(count: number): string[] {
        // Weighted random selection without replacement
        const pool = studentWeights.map(sw => ({ ...sw }))
        const picked: string[] = []
        const maxPick = Math.min(count, pool.length)

        for (let i = 0; i < maxPick; i++) {
            const totalWeight = pool.reduce((s, p) => s + p.weight, 0)
            let rand = rng() * totalWeight
            let idx = 0
            for (let j = 0; j < pool.length; j++) {
                rand -= pool[j].weight
                if (rand <= 0) {
                    idx = j
                    break
                }
            }
            picked.push(pool[idx].user.$id)
            pool.splice(idx, 1)
        }

        return picked
    }

    // Generate Sundays for the past 2 years
    const now = new Date()
    const twoYearsAgo = new Date(now)
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

    let sunday = getPreviousSunday(twoYearsAgo)
    // Move to the first Sunday after twoYearsAgo
    if (sunday < twoYearsAgo) {
        sunday.setDate(sunday.getDate() + 7)
    }

    const lessonDates: Date[] = []
    while (sunday < now) {
        if (!isHolidayWeek(sunday)) {
            lessonDates.push(new Date(sunday))
        }
        sunday.setDate(sunday.getDate() + 7)
    }

    console.log(`Will create ${lessonDates.length} lessons over 2 years (skipping holidays)`)

    let totalLessons = 0
    let totalBookings = 0

    for (let i = 0; i < lessonDates.length; i++) {
        const d = lessonDates[i]
        const year = d.getFullYear()
        const month = d.getMonth() + 1
        const day = d.getDate()

        const dateUTC = amsterdamToUTC(year, month, day, 9, 45)

        // Create lesson
        const lesson = await databases.createDocument(dbId, 'lessons', ID.unique(), {
            date: dateUTC,
            type: 'hatha yoga',
            teacher: 'Ravennah',
        })

        totalLessons++

        // Create bookings
        const bookingCount = getWeightedBookingCount()
        const studentIds = pickStudents(bookingCount)

        for (const studentId of studentIds) {
            await databases.createDocument(dbId, 'bookings', ID.unique(), {
                lessons: lesson.$id,
                students: studentId,
            })
            totalBookings++
        }

        const progress = `[${i + 1}/${lessonDates.length}]`
        console.log(`  ${progress} ${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} -> ${bookingCount} bookings`)
    }

    console.log('\n========================================')
    console.log('Seed complete!')
    console.log(`  Lessons:  ${totalLessons}`)
    console.log(`  Bookings: ${totalBookings}`)
    console.log(`  Avg bookings/lesson: ${(totalBookings / totalLessons).toFixed(1)}`)
    console.log('========================================')
}

main().catch((err) => {
    console.error('Seed failed:', err.message ?? err)
    process.exit(1)
})
