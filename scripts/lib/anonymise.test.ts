import { describe, it, expect, vi } from 'vitest'
import bcrypt from 'bcryptjs'
import { is } from 'drizzle-orm'
import { getTableConfig, PgTable } from 'drizzle-orm/pg-core'
import * as schema from '../../server/database/schema'
import { TABLE_POLICY, COLUMN_POLICY, anonymiseStatements, VERIFY_QUERIES, verifyAnonymised, assertAnonymised, TEST_PASSWORD, TEST_PASSWORD_HASH, DUTCH_FIRST_NAMES, DUTCH_LAST_NAMES } from './anonymise'

const tables = Object.values(schema)
    .filter((value): value is PgTable => is(value, PgTable))
    .map((table) => getTableConfig(table))

const retainedTables = tables.filter((t) => TABLE_POLICY[t.name] !== 'wipe')

describe('anonymisation policy', () => {
    it('finds the schema tables (guards the detection itself)', () => {
        expect(tables.map((t) => t.name)).toContain('students')
        expect(tables.length).toBeGreaterThanOrEqual(10)
    })

    it.each(tables.map((t) => t.name))('has an explicit policy for table %s', (name) => {
        expect(TABLE_POLICY[name], `Add "${name}" to TABLE_POLICY in scripts/lib/anonymise.ts`).toBeDefined()
    })

    it.each(retainedTables.map((t) => [t.name, t.columns.map((c) => c.name)] as const))(
        'has an explicit policy for every column of retained table %s',
        (table, columns) => {
            const missing = columns.filter((c) => !(c in (COLUMN_POLICY[table] ?? {})))
            expect(missing, `Add these ${table} columns to COLUMN_POLICY in scripts/lib/anonymise.ts`).toEqual([])
        }
    )

    it('has no policy entries for tables or columns that no longer exist', () => {
        const names = tables.map((t) => t.name)
        expect(Object.keys(TABLE_POLICY).filter((n) => !names.includes(n))).toEqual([])
        for (const [table, columns] of Object.entries(COLUMN_POLICY)) {
            const actual = tables.find((t) => t.name === table)?.columns.map((c) => c.name) ?? []
            expect(Object.keys(columns).filter((c) => !actual.includes(c)), `stale ${table} columns`).toEqual([])
        }
    })

    it('marks a table as keep only when every column is kept', () => {
        for (const [table, policy] of Object.entries(TABLE_POLICY)) {
            if (policy !== 'keep') continue
            const changed = Object.entries(COLUMN_POLICY[table] ?? {}).filter(([, p]) => p !== 'keep')
            expect(changed, `${table} is "keep" but changes columns`).toEqual([])
        }
    })
})

describe('anonymiseStatements', () => {
    const statements = anonymiseStatements()

    it('wipes every table marked wipe', () => {
        for (const [table, policy] of Object.entries(TABLE_POLICY)) {
            if (policy === 'wipe') expect(statements).toContain(`DELETE FROM "${table}"`)
        }
    })

    it('rewrites every non-kept column of every retained table', () => {
        for (const [table, columns] of Object.entries(COLUMN_POLICY)) {
            const update = statements.find((s) => s.startsWith(`UPDATE "${table}" SET`))
            for (const [column, policy] of Object.entries(columns)) {
                if (policy === 'keep') continue
                expect(update, `${table}.${column}`).toContain(`"${column}" = ${policy === 'null' ? 'NULL' : policy.sql}`)
            }
        }
    })

    it('gives students a Dutch name, a fake email and the welkom password, and scrubs health details', () => {
        const students = statements.find((s) => s.startsWith('UPDATE "students"'))!
        expect(students).toContain(`'${DUTCH_FIRST_NAMES[0]}'`)
        expect(students).toContain(`'${DUTCH_LAST_NAMES[0]}'`)
        expect(students).toContain(`'@example.test'`)
        expect(students).toContain(`"password_hash" = '${TEST_PASSWORD_HASH}'`)
        const health = statements.find((s) => s.startsWith('UPDATE "health"'))!
        expect(health).toContain(`'Testblessure'`)
        expect(health).toContain(`"due_date" = NULL`)
    })
})

describe('verifyAnonymised', () => {
    it('returns nothing when every check is zero', async () => {
        const run = vi.fn().mockResolvedValue([{ n: 0 }])
        await expect(verifyAnonymised(run)).resolves.toEqual([])
        expect(run).toHaveBeenCalledTimes(VERIFY_QUERIES.length)
    })

    it('returns the label of every failing check', async () => {
        const run = vi.fn(async (sql: string) => [{ n: sql === VERIFY_QUERIES[0].sql ? '3' : 0 }])
        await expect(verifyAnonymised(run)).resolves.toEqual([VERIFY_QUERIES[0].label])
    })
})

describe('assertAnonymised', () => {
    it('passes on a clean branch', async () => {
        await expect(assertAnonymised(vi.fn().mockResolvedValue([{ n: 0 }]))).resolves.toBeUndefined()
    })

    it('refuses a branch that still holds personal data', async () => {
        const run = vi.fn(async (sql: string) => [{ n: sql === VERIFY_QUERIES[0].sql ? 1 : 0 }])
        await expect(assertAnonymised(run)).rejects.toThrow(`Anonymisation incomplete: ${VERIFY_QUERIES[0].label}`)
    })
})

describe('test logins', () => {
    it('stores a bcrypt hash that really matches the password "welkom"', async () => {
        expect(TEST_PASSWORD).toBe('welkom')
        await expect(bcrypt.compare('welkom', TEST_PASSWORD_HASH)).resolves.toBe(true)
        await expect(bcrypt.compare('wrong', TEST_PASSWORD_HASH)).resolves.toBe(false)
    })
})

describe('Dutch names', () => {
    it.each([['first', DUTCH_FIRST_NAMES], ['last', DUTCH_LAST_NAMES]])('has plenty of SQL-safe %s names', (_kind, names) => {
        expect(names.length).toBeGreaterThanOrEqual(30)
        expect(new Set(names).size).toBe(names.length)
        for (const name of names) expect(name).toMatch(/^[A-Za-z][A-Za-z ]*$/) // no quotes: safe inside a SQL literal
    })

    it('picks a name deterministically from the student id (same name after every refresh)', () => {
        const name = (COLUMN_POLICY.students.name as { sql: string }).sql
        expect(name).toContain('hashtext("id"')
        expect(name).not.toMatch(/random\(/)
    })
})

describe('verification follows the column policy', () => {
    it('checks every rewritten or cleared column against its own rule', () => {
        for (const [table, columns] of Object.entries(COLUMN_POLICY)) {
            for (const [column, policy] of Object.entries(columns)) {
                if (policy === 'keep') continue
                const expected = policy === 'null'
                    ? `SELECT count(*) AS n FROM "${table}" WHERE "${column}" IS NOT NULL`
                    : `SELECT count(*) AS n FROM "${table}" WHERE "${column}" IS DISTINCT FROM (${policy.sql})`
                expect(VERIFY_QUERIES.map((q) => q.sql), `${table}.${column}`).toContain(expected)
            }
        }
    })

    it('checks every wiped table is empty', () => {
        for (const [table, policy] of Object.entries(TABLE_POLICY)) {
            if (policy === 'wipe') expect(VERIFY_QUERIES.map((q) => q.sql)).toContain(`SELECT count(*) AS n FROM "${table}"`)
        }
    })
})
