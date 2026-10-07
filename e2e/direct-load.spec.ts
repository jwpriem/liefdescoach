/**
 * E2E test: pages that need a logged-in user or an admin work when they are the first page loaded
 * (a reload or a bookmark), before the "who is logged in" request has finished.
 *
 * Run against a throwaway Neon branch: yarn test:e2e:branch e2e/direct-load.spec.ts
 */

import { test, expect } from '@playwright/test'
import { E2E_ADMIN, E2E_PASSWORD, E2E_STUDENT } from './fixtures'
import { login } from './helpers'

test.describe('Direct loads', () => {
    test('a student who opens /account?tab=gegevens directly sees that tab and keeps the query', async ({ page }) => {
        await login(page, E2E_STUDENT.email, E2E_PASSWORD)

        await page.goto('/account?tab=gegevens')

        await expect(page.getByRole('heading', { name: 'Mijn gegevens' })).toBeVisible({ timeout: 15_000 })
        await expect(page).toHaveURL(/\/account\?tab=gegevens$/)
    })

    test('an admin who opens /archief directly stays on the archive', async ({ page }) => {
        await login(page, E2E_ADMIN.email, E2E_PASSWORD)

        await page.goto('/archief')

        await expect(page.getByRole('heading', { name: 'Lessen Archief' })).toBeVisible({ timeout: 15_000 })
        await expect(page).toHaveURL(/\/archief$/)
    })

    test('a logged-out visitor who opens /account directly ends on the login page', async ({ page }) => {
        await page.goto('/account')

        await page.waitForURL('**/login', { timeout: 15_000 })
    })

    test('a student who opens /archief directly does not see the archive and ends on /account', async ({ page }) => {
        await login(page, E2E_STUDENT.email, E2E_PASSWORD)

        await page.goto('/archief')

        await page.waitForURL('**/account', { timeout: 15_000 })
        await expect(page.getByRole('heading', { name: 'Lessen Archief' })).toHaveCount(0)
    })
})
