/**
 * Turns a copy of production into test data: personal data is replaced or removed.
 * Every table and every students column must be listed here — the unit tests fail
 * when the schema gains one that isn't, so new personal data can't slip through.
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

export const STUDENT_COLUMN_POLICY: Record<string, 'keep' | 'fake' | 'null'> = {
    id: 'keep',
    name: 'fake',
    email: 'fake',
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
}

const FAKE_STUDENT_COLUMNS: Record<string, string> = {
    name: `'Student ' || left(md5("id"), 6)`,
    email: `CASE WHEN "email" IS NULL THEN NULL ELSE 'student-' || left(md5("id"), 10) || '@example.test' END`,
}

export function anonymiseStatements(): string[] {
    const wipes = Object.entries(TABLE_POLICY)
        .filter(([, policy]) => policy === 'wipe')
        .map(([table]) => `DELETE FROM "${table}"`)

    const studentSets = Object.entries(STUDENT_COLUMN_POLICY)
        .filter(([, policy]) => policy !== 'keep')
        .map(([column, policy]) => `"${column}" = ${policy === 'null' ? 'NULL' : FAKE_STUDENT_COLUMNS[column]}`)

    return [
        ...wipes,
        `UPDATE "students" SET ${studentSets.join(', ')}`,
        `UPDATE "health" SET "injury" = CASE WHEN "injury" IS NULL THEN NULL ELSE 'Testblessure' END, "pregnancy" = false, "due_date" = NULL`,
    ]
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
