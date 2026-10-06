/**
 * E2E test: the privacy statement is public and reachable from where people share their data.
 *
 * Run against a throwaway Neon branch (recommended): yarn test:e2e:branch e2e/privacy.spec.ts
 */

import { test, expect } from '@playwright/test'

test.describe('Privacy statement', () => {
    test('is reachable from the footer and says who is responsible and how to get data deleted', async ({ page }) => {
        // Start on a client-rendered page: in dev, the cached payload of '/' blocks other cached routes
        await page.goto('/login')
        await page.locator('footer').getByRole('link', { name: 'Privacyverklaring' }).click()
        await page.waitForURL('**/privacy', { timeout: 10_000 })

        await expect(page.getByRole('heading', { level: 1, name: /Privacyverklaring/ })).toBeVisible()
        await expect(page.getByText('Emmy van Leersumhof 24a').first()).toBeVisible()
        await expect(page.getByRole('link', { name: 'info@ravennah.com' }).first()).toBeVisible()
        await expect(page.getByRole('heading', { name: /Je gegevens laten verwijderen/ })).toBeVisible()
    })

    test('is linked from the registration form', async ({ page }) => {
        await page.goto('/login')
        await page.getByRole('button', { name: /Registreren/ }).first().click()

        await expect(page.getByRole('link', { name: 'privacyverklaring', exact: true })).toHaveAttribute('href', '/privacy')
    })
})
