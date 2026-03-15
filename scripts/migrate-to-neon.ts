/**
 * One-time data migration script: Appwrite → Neon PostgreSQL
 *
 * Usage: yarn db:migrate-data
 *
 * Requires env vars:
 *   - NUXT_DATABASE_URL (Neon connection string)
 *   - NUXT_PUBLIC_PROJECT (Appwrite project ID)
 *   - NUXT_APPWRITE_KEY (Appwrite server API key)
 *   - NUXT_PUBLIC_DATABASE (Appwrite database ID)
 *
 * This script is idempotent (ON CONFLICT DO NOTHING).
 */
import 'dotenv/config'
import { Client, Users, Databases, TablesDB, Query, ID } from 'node-appwrite'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../server/database/schema'

const APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1'
const PROJECT_ID = process.env.NUXT_PUBLIC_PROJECT!
const API_KEY = process.env.NUXT_APPWRITE_KEY!
const DATABASE_ID = process.env.NUXT_PUBLIC_DATABASE!
const DATABASE_URL = process.env.NUXT_DATABASE_URL!

if (!PROJECT_ID || !API_KEY || !DATABASE_ID || !DATABASE_URL) {
    console.error('Missing required env vars. See script header for required variables.')
    process.exit(1)
}

// Appwrite client
const client = new Client()
client.setEndpoint(APPWRITE_ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY)
const tablesDB = new TablesDB(client)
const databases = new Databases(client)
const users = new Users(client)

// Neon/Drizzle client
const sql = neon(DATABASE_URL)
const db = drizzle(sql, { schema })

async function paginateAppwrite<T>(
    fetcher: (offset: number) => Promise<{ rows?: T[]; documents?: T[]; users?: T[]; total: number }>,
    label: string
): Promise<T[]> {
    const all: T[] = []
    let offset = 0
    const limit = 100
    while (true) {
        const res = await fetcher(offset)
        const items = res.rows ?? res.documents ?? res.users ?? []
        all.push(...items)
        console.log(`  ${label}: fetched ${all.length} / ${res.total}`)
        if (items.length < limit) break
        offset += limit
    }
    return all
}

function extractId(val: any): string | null {
    if (!val) return null
    if (typeof val === 'string') return val
    if (val.$id) return val.$id
    return null
}

async function migrateStudents() {
    console.log('\n📦 Migrating students (from Auth users + students collection)...')

    // 1. Fetch all Auth users
    const authUsers = await paginateAppwrite(
        (offset) => users.list([Query.limit(100), Query.offset(offset)]),
        'Auth users'
    )

    // 2. Fetch all students from DB
    const studentDocs = await paginateAppwrite(
        (offset) => tablesDB.listRows(DATABASE_ID, 'students', [Query.limit(100), Query.offset(offset)]),
        'Student docs'
    )

    const studentMap = new Map(studentDocs.map((s: any) => [s.$id, s]))

    // 3. Fetch prefs for each auth user
    const prefsMap = new Map<string, Record<string, any>>()
    for (const u of authUsers as any[]) {
        try {
            const prefs = await users.getPrefs(u.$id)
            if (prefs && Object.keys(prefs).length > 0) {
                prefsMap.set(u.$id, prefs)
            }
        } catch {
            // Skip if prefs can't be fetched
        }
    }

    // 4. Merge Auth + student data + prefs
    const values = authUsers.map((u: any) => {
        const student = studentMap.get(u.$id) as any
        return {
            id: u.$id,
            name: u.name || student?.name || 'Unknown',
            email: u.email || student?.email || '',
            passwordHash: null as string | null, // Will be populated during lazy migration
            isAdmin: (u.labels ?? []).includes('admin'),
            emailVerified: u.emailVerification ?? false,
            dateOfBirth: student?.dateOfBirth ? new Date(student.dateOfBirth) : null,
            phone: student?.phone ?? null,
            prefs: prefsMap.get(u.$id) ?? {},
            createdAt: u.$createdAt ? new Date(u.$createdAt) : new Date(),
        }
    })

    // Also add any student docs not in Auth (e.g., trial lesson guests)
    for (const doc of studentDocs as any[]) {
        if (!authUsers.find((u: any) => u.$id === doc.$id)) {
            values.push({
                id: doc.$id,
                name: doc.name || 'Unknown',
                email: doc.email || '',
                passwordHash: null,
                isAdmin: false,
                emailVerified: false,
                dateOfBirth: doc.dateOfBirth ? new Date(doc.dateOfBirth) : null,
                phone: doc.phone ?? null,
                createdAt: doc.$createdAt ? new Date(doc.$createdAt) : new Date(),
            })
        }
    }

    if (values.length > 0) {
        // Insert in batches of 50
        for (let i = 0; i < values.length; i += 50) {
            const batch = values.slice(i, i + 50)
            await db.insert(schema.students).values(batch).onConflictDoNothing()
        }
    }

    console.log(`  ✅ Students: ${values.length} records`)
    return values.length
}


async function migrateLessons() {
    console.log('\n📦 Migrating lessons...')

    const lessons = await paginateAppwrite(
        (offset) => tablesDB.listRows(DATABASE_ID, 'lessons', [Query.limit(100), Query.offset(offset)]),
        'Lessons'
    )

    const values = (lessons as any[]).map((l) => ({
        id: l.$id,
        date: new Date(l.date),
        type: l.type as 'hatha yoga' | 'guest lesson' | 'peachy bum',
        teacher: l.teacher ?? null,
        createdAt: l.$createdAt ? new Date(l.$createdAt) : new Date(),
    }))

    if (values.length > 0) {
        for (let i = 0; i < values.length; i += 50) {
            await db.insert(schema.lessons).values(values.slice(i, i + 50)).onConflictDoNothing()
        }
    }

    console.log(`  ✅ Lessons: ${values.length} records`)
    return values.length
}

async function migrateBookings() {
    console.log('\n📦 Migrating bookings...')

    // Query existing student and lesson IDs from Neon to avoid FK violations
    const existingStudents = await db.select({ id: schema.students.id }).from(schema.students)
    const studentIds = new Set(existingStudents.map(s => s.id))
    const existingLessons = await db.select({ id: schema.lessons.id }).from(schema.lessons)
    const lessonIds = new Set(existingLessons.map(l => l.id))

    const bookings = await paginateAppwrite(
        (offset) => tablesDB.listRows(DATABASE_ID, 'bookings', [Query.limit(100), Query.offset(offset)]),
        'Bookings'
    )

    const allValues = (bookings as any[]).map((b) => ({
        id: b.$id,
        lessonId: extractId(b.lessons)!,
        studentId: extractId(b.students),
        createdAt: b.$createdAt ? new Date(b.$createdAt) : new Date(),
    }))

    // Filter out bookings with missing lesson or orphaned student references
    const values = allValues.filter(v => {
        if (!v.lessonId || !lessonIds.has(v.lessonId)) return false
        if (v.studentId && !studentIds.has(v.studentId)) {
            console.log(`  ⚠️ Skipping booking ${v.id}: student ${v.studentId} not found in students table`)
            return false
        }
        return true
    })

    if (values.length > 0) {
        for (let i = 0; i < values.length; i += 50) {
            await db.insert(schema.bookings).values(values.slice(i, i + 50)).onConflictDoNothing()
        }
    }

    const skipped = allValues.length - values.length
    console.log(`  ✅ Bookings: ${values.length} records${skipped > 0 ? ` (${skipped} skipped due to missing references)` : ''}`)
    return values.length
}

async function migrateCredits() {
    console.log('\n📦 Migrating credits...')

    let credits: any[] = []
    try {
        credits = await paginateAppwrite(
            (offset) => tablesDB.listRows(DATABASE_ID, 'credits', [Query.limit(100), Query.offset(offset)]),
            'Credits'
        )
    } catch {
        console.log('  ⚠️ Credits collection not found, skipping')
        return 0
    }

    // Query existing student IDs to avoid FK violations
    const existingStudents = await db.select({ id: schema.students.id }).from(schema.students)
    const studentIds = new Set(existingStudents.map(s => s.id))

    const allValues = credits.map((c: any) => ({
        id: c.$id,
        studentId: c.studentId,
        bookingId: c.bookingId ?? null,
        type: c.type as 'credit_1' | 'credit_5' | 'credit_10' | 'credit_20',
        validFrom: new Date(c.validFrom),
        validTo: new Date(c.validTo),
        createdAt: new Date(c.createdAt),
        usedAt: c.usedAt ? new Date(c.usedAt) : null,
    }))

    const values = allValues.filter(v => {
        if (v.studentId && !studentIds.has(v.studentId)) {
            console.log(`  ⚠️ Skipping credit ${v.id}: student ${v.studentId} not found`)
            return false
        }
        return true
    })

    if (values.length > 0) {
        for (let i = 0; i < values.length; i += 50) {
            await db.insert(schema.credits).values(values.slice(i, i + 50)).onConflictDoNothing()
        }
    }

    const skipped = allValues.length - values.length
    console.log(`  ✅ Credits: ${values.length} records${skipped > 0 ? ` (${skipped} skipped due to missing references)` : ''}`)
    return values.length
}

async function migrateHealth() {
    console.log('\n📦 Migrating health records...')

    let healthDocs: any[] = []
    try {
        healthDocs = await paginateAppwrite(
            (offset) => databases.listDocuments(DATABASE_ID, 'health', [Query.limit(100), Query.offset(offset)]),
            'Health'
        )
    } catch {
        console.log('  ⚠️ Health collection not found, skipping')
        return 0
    }

    // Query existing student IDs to avoid FK violations
    const existingStudents = await db.select({ id: schema.students.id }).from(schema.students)
    const studentIds = new Set(existingStudents.map(s => s.id))

    const allValues = healthDocs.map((h: any) => ({
        id: h.$id,
        studentId: extractId(h.student)!,
        injury: h.injury ?? null,
        pregnancy: h.pregnancy ?? null,
        dueDate: h.dueDate ? new Date(h.dueDate) : null,
    })).filter(v => v.studentId)

    const values = allValues.filter(v => {
        if (!studentIds.has(v.studentId)) {
            console.log(`  ⚠️ Skipping health record ${v.id}: student ${v.studentId} not found`)
            return false
        }
        return true
    })

    if (values.length > 0) {
        for (let i = 0; i < values.length; i += 50) {
            await db.insert(schema.health).values(values.slice(i, i + 50)).onConflictDoNothing()
        }
    }

    const skipped = allValues.length - values.length
    console.log(`  ✅ Health: ${values.length} records${skipped > 0 ? ` (${skipped} skipped due to missing references)` : ''}`)
    return values.length
}

async function main() {
    console.log('🚀 Starting Appwrite → Neon migration')
    console.log(`   Appwrite Project: ${PROJECT_ID}`)
    console.log(`   Appwrite Database: ${DATABASE_ID}`)
    console.log(`   Neon: ${DATABASE_URL.replace(/:[^:@]+@/, ':***@')}`)

    const counts = {
        students: await migrateStudents(),
        lessons: await migrateLessons(),
        bookings: await migrateBookings(),
        credits: await migrateCredits(),
        health: await migrateHealth(),
    }

    console.log('\n🎉 Migration complete!')
    console.log('   Summary:', counts)
}

main().catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
})
