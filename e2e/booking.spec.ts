/**
 * E2E test: Login and book a lesson.
 *
 * Required env vars:
 *   TEST_EMAIL       – email address of an existing user
 *   TEST_PASSWORD    – password for that user
 *   BASE_URL         – (optional) defaults to http://localhost:3000
 *
 * The user must have at least 1 credit to complete the booking test.
 *
 * Run:
 *   TEST_EMAIL=x@y.com TEST_PASSWORD=secret npx playwright test
 *   npm run test:e2e   (reads from .env)
 */

import { test, expect } from '@playwright/test'

const email = process.env.TEST_EMAIL
const password = process.env.TEST_PASSWORD

test.beforeEach(() => {
    if (!email || !password) {
        throw new Error('Set TEST_EMAIL and TEST_PASSWORD environment variables')
    }
})

test.describe('Authentication', () => {
    test('should log in and redirect to account page', async ({ page }) => {
        await page.goto('/login')

        // Wait for the form to be rendered (client-side only)
        await page.waitForSelector('#email')

        await page.fill('#email', email!)
        await page.fill('#password', password!)
        await page.click('button:has-text("Login")')

        // After login, user is redirected to the account page
        await page.waitForURL('**/account', { timeout: 15_000 })

        // Verify the account page loaded with user content
        await expect(page.locator('text=Boekingen')).toBeVisible({ timeout: 10_000 })

        // --- Logout ---
        await page.locator('nav span.nav-item', { hasText: /logout/i }).click()
        await page.waitForURL('**/', { timeout: 10_000 })
    })
})

test.describe('Booking flow', () => {
    test('should log in and book the first available lesson', async ({ page }) => {
        // --- Step 1: Login ---
        await page.goto('/login')
        await page.waitForSelector('#email')
        await page.fill('#email', email!)
        await page.fill('#password', password!)
        await page.click('button:has-text("Login")')
        await page.waitForURL('**/account', { timeout: 15_000 })

        // --- Step 2: Navigate to lessons ---
        await page.goto('/lessen')

        // Wait for client-side hydration to recognize the logged-in user
        // (SSR renders "Login om te boeken" links, hydration swaps them to "Boek" buttons)
        await expect(page.getByRole('link', { name: 'Login om te boeken' })).toBeHidden({ timeout: 15_000 })

        // --- Step 3: Find and click the first available "Boek" button ---
        const bookButton = page.getByRole('button', { name: 'Boek' }).first()
        const hasBookButton = await bookButton.waitFor({ state: 'visible', timeout: 15_000 }).then(() => true).catch(() => false)

        if (!hasBookButton) {
            test.skip(true, 'No available lessons to book (all full or already booked)')
            return
        }

        await bookButton.click()

        // --- Step 4: Verify booking succeeded ---
        // The toast notification "Je les is geboekt!" should appear
        await expect(page.locator('text=Je les is geboekt!')).toBeVisible({ timeout: 15_000 })

        // The "Boek" button should have changed to "Geboekt" for this lesson
        await expect(page.locator('text=Geboekt').first()).toBeVisible({ timeout: 10_000 })

        // --- Step 5: Verify booking appears on account page ---
        await page.goto('/account')
        await page.waitForLoadState('networkidle')

        // The bookings section should contain at least one booking card
        await expect(page.locator('text=Boekingen')).toBeVisible({ timeout: 10_000 })
        await expect(page.locator('.bg-gray-800').first()).toBeVisible({ timeout: 10_000 })

        // --- Step 6: Logout ---
        await page.locator('nav span.nav-item', { hasText: /logout/i }).click()
        await page.waitForURL('**/', { timeout: 10_000 })
    })

    test('should show error when user has no credits', async ({ page }) => {
        // This test validates that the server rejects bookings with insufficient credits.
        // It will only fail-as-expected if the test user has 0 credits.
        // If the user has credits, the test is skipped.
        await page.goto('/login')
        await page.waitForSelector('#email')
        await page.fill('#email', email!)
        await page.fill('#password', password!)
        await page.click('button:has-text("Login")')
        await page.waitForURL('**/account', { timeout: 15_000 })

        // Check credits — navigate to account to see the value
        const creditsText = await page.locator('text=/\\d+ credit/i').textContent().catch(() => null)
        const credits = creditsText ? parseInt(creditsText.match(/(\d+)/)?.[1] ?? '0', 10) : null

        if (credits === null || credits > 0) {
            test.skip(true, 'User has credits — skipping no-credits test')
            return
        }

        await page.goto('/lessen')

        // Wait for client-side hydration to recognize the logged-in user
        await expect(page.getByRole('link', { name: 'Login om te boeken' })).toBeHidden({ timeout: 15_000 })

        const bookButton = page.getByRole('button', { name: 'Boek' }).first()
        const hasBookButton = await bookButton.waitFor({ state: 'visible', timeout: 15_000 }).then(() => true).catch(() => false)

        if (!hasBookButton) {
            test.skip(true, 'No available lessons to test')
            return
        }

        await bookButton.click()

        // Should see an error about insufficient credits
        await expect(page.locator('text=/credit/i')).toBeVisible({ timeout: 10_000 })

        // --- Logout ---
        await page.locator('nav span.nav-item', { hasText: /logout/i }).click()
        await page.waitForURL('**/', { timeout: 10_000 })
    })
})
