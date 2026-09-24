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

/** Every anonymised student can log in with their fake email and this password (test branches only). */
export const TEST_PASSWORD = 'welkom'
/** bcrypt hash of TEST_PASSWORD, cost 12 like the app (verified by the unit tests). */
export const TEST_PASSWORD_HASH = '$2b$12$GsMuKb.3S9I/.trAHZLbmuL6f/8Q9v9UcJOr/wrxOasc1ns9rFsd.'

export const DUTCH_FIRST_NAMES = [
    'Anna', 'Emma', 'Sanne', 'Lotte', 'Fleur', 'Eva', 'Julia', 'Sophie', 'Lisa', 'Iris',
    'Noa', 'Tess', 'Femke', 'Anouk', 'Roos', 'Lieke', 'Marloes', 'Esther', 'Ingrid', 'Karin',
    'Daan', 'Sem', 'Lucas', 'Levi', 'Bram', 'Thijs', 'Ruben', 'Jesse', 'Sven', 'Joris',
    'Pieter', 'Bas', 'Maarten', 'Jeroen', 'Niels', 'Wouter', 'Tim', 'Koen', 'Stijn', 'Mark',
]

export const DUTCH_LAST_NAMES = [
    'de Jong', 'Jansen', 'de Vries', 'van den Berg', 'van Dijk', 'Bakker', 'Janssen', 'Visser', 'Smit', 'Meijer',
    'de Boer', 'Mulder', 'de Groot', 'Bos', 'Vos', 'Peters', 'Hendriks', 'van Leeuwen', 'Dekker', 'Brouwer',
    'de Wit', 'Dijkstra', 'Smits', 'de Graaf', 'van der Meer', 'van der Linden', 'Kok', 'Jacobs', 'de Haan', 'Vermeulen',
    'van den Heuvel', 'van der Veen', 'van den Broek', 'de Bruijn', 'de Bruin', 'van der Heijden', 'Schouten', 'van Beek', 'Willems', 'van Vliet',
]

/** SQL picking one entry of `names`, deterministically from the student id (same result on every refresh). */
function pickByStudentId(names: string[], salt: string): string {
    const list = names.map((name) => `'${name}'`).join(', ')
    return `(ARRAY[${list}])[1 + mod(abs(hashtext("id" || '${salt}')::bigint), ${names.length})]`
}

/** 'keep' copies the value, 'null' clears it, { sql } replaces it with a SQL expression. */
export type ColumnPolicy = 'keep' | 'null' | { sql: string }

export const COLUMN_POLICY: Record<string, Record<string, ColumnPolicy>> = {
    students: {
        id: 'keep',
        name: { sql: `${pickByStudentId(DUTCH_FIRST_NAMES, ':first')} || ' ' || ${pickByStudentId(DUTCH_LAST_NAMES, ':last')}` },
        email: { sql: `CASE WHEN "email" IS NULL THEN NULL ELSE 'student-' || left(md5("id"), 10) || '@example.test' END` },
        password_hash: { sql: `'${TEST_PASSWORD_HASH}'` },
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

/** One check per rewritten/cleared column (must match its rule exactly) and per wiped table (must be empty). */
export const VERIFY_QUERIES: { label: string; sql: string }[] = [
    ...Object.entries(COLUMN_POLICY).flatMap(([table, columns]) =>
        Object.entries(columns)
            .filter(([, policy]) => policy !== 'keep')
            .map(([column, policy]) => ({
                label: `${table}.${column} not anonymised`,
                sql: policy === 'null'
                    ? `SELECT count(*) AS n FROM "${table}" WHERE "${column}" IS NOT NULL`
                    : `SELECT count(*) AS n FROM "${table}" WHERE "${column}" IS DISTINCT FROM (${(policy as { sql: string }).sql})`,
            }))
    ),
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
