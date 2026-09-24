import { describe, it, expect, vi } from 'vitest'
import { is } from 'drizzle-orm'
import { getTableConfig, PgTable } from 'drizzle-orm/pg-core'
import * as schema from '../../server/database/schema'
import { TABLE_POLICY, STUDENT_COLUMN_POLICY, anonymiseStatements, VERIFY_QUERIES, verifyAnonymised } from './anonymise'

const tables = Object.values(schema)
    .filter((value): value is PgTable => is(value, PgTable))
    .map((table) => getTableConfig(table))

describe('anonymisation policy', () => {
    it('finds the schema tables (guards the detection itself)', () => {
        expect(tables.map((t) => t.name)).toContain('students')
        expect(tables.length).toBeGreaterThanOrEqual(10)
    })

    it.each(tables.map((t) => t.name))('has an explicit policy for table %s', (name) => {
        expect(TABLE_POLICY[name], `Add "${name}" to TABLE_POLICY in scripts/lib/anonymise.ts`).toBeDefined()
    })

    it('has an explicit policy for every students column', () => {
        const columns = tables.find((t) => t.name === 'students')!.columns.map((c) => c.name)
        const missing = columns.filter((c) => !(c in STUDENT_COLUMN_POLICY))
        expect(missing, 'Add these columns to STUDENT_COLUMN_POLICY').toEqual([])
    })

    it('has no policy entries for tables that no longer exist', () => {
        const names = tables.map((t) => t.name)
        expect(Object.keys(TABLE_POLICY).filter((n) => !names.includes(n))).toEqual([])
    })
})

describe('anonymiseStatements', () => {
    const statements = anonymiseStatements()

    it('wipes every table marked wipe', () => {
        for (const [table, policy] of Object.entries(TABLE_POLICY)) {
            if (policy === 'wipe') expect(statements).toContain(`DELETE FROM "${table}"`)
        }
    })

    it('nulls every students column marked null and fakes name and email', () => {
        const update = statements.find((s) => s.startsWith('UPDATE "students"'))!
        for (const [column, policy] of Object.entries(STUDENT_COLUMN_POLICY)) {
            if (policy === 'null') expect(update).toContain(`"${column}" = NULL`)
        }
        expect(update).toContain(`"name" = 'Student ' || left(md5("id"), 6)`)
        expect(update).toContain(`'@example.test'`)
    })

    it('scrubs health details', () => {
        expect(statements.some((s) => s.startsWith('UPDATE "health"') && s.includes(`'Testblessure'`))).toBe(true)
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
