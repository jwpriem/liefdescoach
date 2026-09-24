import type { NeonBranch } from './neon'
import { E2E_LESSON_IDS } from '../../e2e/fixtures'

export function e2eBranchName(now: Date): string {
    const stamp = now.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15)
    return `e2e-${stamp}`
}

/** Local runs are sequential, so any e2e-* branch at start-up is a leftover from a crashed run. */
export function staleE2EBranches(branches: NeonBranch[]): NeonBranch[] {
    return branches.filter((b) => b.name.startsWith('e2e-'))
}

/** Proves the app is connected to the seeded test branch, not to production. */
export function isServingTestBranch(lessonsJson: unknown): boolean {
    const rows = (lessonsJson as { rows?: unknown } | null | undefined)?.rows
    return Array.isArray(rows) && rows.some((row) => (row as { $id?: string })?.$id === E2E_LESSON_IDS[0])
}
