/**
 * Turns a copy of production into test data: personal data is replaced or removed.
 * Every table, and every column of every table that isn't wiped, must be listed here —
 * the unit tests fail when the schema gains one that isn't, so new personal data can't slip through.
 */

export const TABLE_POLICY: Record<string, 'keep' | 'anonymise' | 'wipe'> = {
    students: 'anonymise',
    health: 'anonymise',
    lessons: 'keep',
    bookings: 'keep',
    credits: 'keep',
    sessions: 'wipe',
    otp_codes: 'wipe',
    passkey_credentials: 'wipe',
    push_subscriptions: 'wipe',
    login_history: 'wipe',
}

/** 'keep' copies the value, 'null' clears it, { sql } replaces it with a SQL expression. */
export type ColumnPolicy = 'keep' | 'null' | { sql: string }

export const COLUMN_POLICY: Record<string, Record<string, ColumnPolicy>> = {
    students: {
        id: 'keep',
        name: { sql: `'Student ' || left(md5("id"), 6)` },
        email: { sql: `CASE WHEN "email" IS NULL THEN NULL ELSE 'student-' || left(md5("id"), 10) || '@example.test' END` },
        password_hash: 'null',
        is_admin: 'keep',
        email_verified: 'keep',
        date_of_birth: 'null',
        phone: 'null',
        archived: 'keep',
        reminders: 'keep',
        push_notifications: 'keep',
        phone_requested: 'keep',
        created_at: 'keep',
    },
    health: {
        id: 'keep',
        student_id: 'keep',
        injury: { sql: `CASE WHEN "injury" IS NULL THEN NULL ELSE 'Testblessure' END` },
        pregnancy: { sql: 'false' },
        due_date: 'null',
    },
    lessons: {
        id: 'keep',
        date: 'keep',
        type: 'keep',
        teacher: 'keep', // public teacher names shown on the website
        max_spots: 'keep',
        created_at: 'keep',
    },
    bookings: {
        id: 'keep',
        lesson_id: 'keep',
        student_id: 'keep',
        source: 'keep',
        created_at: 'keep',
    },
    credits: {
        id: 'keep',
        student_id: 'keep',
        booking_id: 'keep',
        type: 'keep',
        valid_from: 'keep',
        valid_to: 'keep',
        created_at: 'keep',
        used_at: 'keep',
    },
}

export function anonymiseStatements(): string[] {
    const wipes = Object.entries(TABLE_POLICY)
        .filter(([, policy]) => policy === 'wipe')
        .map(([table]) => `DELETE FROM "${table}"`)

    const updates = Object.entries(COLUMN_POLICY).flatMap(([table, columns]) => {
        const sets = Object.entries(columns)
            .filter(([, policy]) => policy !== 'keep')
            .map(([column, policy]) => `"${column}" = ${policy === 'null' ? 'NULL' : (policy as { sql: string }).sql}`)
        return sets.length > 0 ? [`UPDATE "${table}" SET ${sets.join(', ')}`] : []
    })

    return [...wipes, ...updates]
}

export const VERIFY_QUERIES: { label: string; sql: string }[] = [
    { label: 'students with a real email address', sql: `SELECT count(*) AS n FROM "students" WHERE "email" IS NOT NULL AND "email" NOT LIKE '%@example.test'` },
    { label: 'students with a real name', sql: `SELECT count(*) AS n FROM "students" WHERE "name" NOT LIKE 'Student %'` },
    { label: 'students with phone, birth date or password', sql: `SELECT count(*) AS n FROM "students" WHERE "phone" IS NOT NULL OR "date_of_birth" IS NOT NULL OR "password_hash" IS NOT NULL` },
    { label: 'health rows with real details', sql: `SELECT count(*) AS n FROM "health" WHERE ("injury" IS NOT NULL AND "injury" <> 'Testblessure') OR "pregnancy" = true OR "due_date" IS NOT NULL` },
    ...Object.entries(TABLE_POLICY)
        .filter(([, policy]) => policy === 'wipe')
        .map(([table]) => ({ label: `rows left in ${table}`, sql: `SELECT count(*) AS n FROM "${table}"` })),
]

export async function verifyAnonymised(run: (sql: string) => Promise<{ n: number | string }[]>): Promise<string[]> {
    const failures: string[] = []
    for (const check of VERIFY_QUERIES) {
        const [row] = await run(check.sql)
        if (Number(row?.n ?? 0) > 0) failures.push(check.label)
    }
    return failures
}

/** Throws unless the branch passes every anonymisation check. */
export async function assertAnonymised(run: (sql: string) => Promise<{ n: number | string }[]>): Promise<void> {
    const failures = await verifyAnonymised(run)
    if (failures.length > 0) {
        throw new Error(`Anonymisation incomplete: ${failures.join(', ')}`)
    }
}
