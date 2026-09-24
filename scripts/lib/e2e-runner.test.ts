import { describe, it, expect } from 'vitest'
import { e2eBranchName, staleE2EBranches, isServingTestBranch } from './e2e-runner'

describe('e2eBranchName', () => {
    it('is e2e- plus a sortable UTC timestamp', () => {
        expect(e2eBranchName(new Date('2026-09-24T10:15:00Z'))).toBe('e2e-20260924-101500')
    })
})

describe('staleE2EBranches', () => {
    it('selects only e2e-* branches', () => {
        const branches = [
            { id: '1', name: 'production', primary: true },
            { id: '2', name: 'seed' },
            { id: '3', name: 'dev' },
            { id: '4', name: 'e2e-20260923-080000' },
            { id: '5', name: 'e2e-20260924-090000' },
        ]
        expect(staleE2EBranches(branches).map((b) => b.id)).toEqual(['4', '5'])
    })
})

describe('isServingTestBranch', () => {
    it('is true when the seeded lesson is served', () => {
        expect(isServingTestBranch({ rows: [{ $id: 'real-lesson' }, { $id: 'e2e-lesson-1' }] })).toBe(true)
    })

    it('is false for production-like data without the seeded lesson', () => {
        expect(isServingTestBranch({ rows: [{ $id: 'real-lesson' }] })).toBe(false)
    })

    it.each([null, undefined, 'Server Error', {}, { rows: 'x' }])('is false for unexpected body %j', (body) => {
        expect(isServingTestBranch(body)).toBe(false)
    })
})
