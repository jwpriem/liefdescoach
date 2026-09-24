/** Test identities and data that scripts/lib/seed-e2e.ts creates on every e2e branch. */

export const E2E_PASSWORD = 'e2e-Wachtwoord-2026'

export const E2E_STUDENT = { id: 'e2e-student', name: 'E2E Student', email: 'e2e-student@example.test' } as const
export const E2E_ADMIN = { id: 'e2e-admin', name: 'E2E Admin', email: 'e2e-admin@example.test' } as const

export const E2E_LESSON_IDS = ['e2e-lesson-1', 'e2e-lesson-2'] as const
export const E2E_CREDITS = 5
