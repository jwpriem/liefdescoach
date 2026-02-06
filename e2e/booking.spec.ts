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

import { test, expect, Page } from '@playwright/test'

const email = process.env.TEST_EMAIL
const password = process.env.TEST_PASSWORD

/**
 * Login and ensure the Appwrite session cookie is set for server-side auth.
 *
 * The Appwrite Web SDK v21 stores sessions internally (localStorage /
 * X-Fallback-Cookies) but does not reliably set document.cookie on HTTP.
 * The Nuxt server reads the session from document.cookie, so we capture
 * the session secret from the Appwrite API response at creation time and
 * set the cookie explicitly.
 */
async function login(page: Page) {
    // Listen for the Appwrite session creation API response
    const sessionResponsePromise = page.waitForResponse(
        resp => resp.url().includes('/v1/account/sessions') && resp.ok()
    )

    await page.goto('/login')
    await page.waitForSelector('#email')
    await page.fill('#email', email!)
    await page.fill('#password', password!)
    await page.click('button:has-text("Login")')

    // Capture the session secret and project ID from the API exchange
    const sessionResponse = await sessionResponsePromise
    const projectId = await sessionResponse.request().headerValue('x-appwrite-project')
    const sessionData = await sessionResponse.json()

    await page.waitForURL('**/account', { timeout: 15_000 })

    // Set the cookie so the Nuxt server can authenticate API requests
    if (sessionData?.secret && projectId) {
        await page.evaluate(({ name, value }) => {
            document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`
        }, { name: `a_session_${projectId}`, value: sessionData.secret })
    }
}

async function logout(page: Page) {
    await page.locator('nav span.nav-item', { hasText: /logout/i }).click()
    await page.waitForURL('**/', { timeout: 10_000 })
}

/**
 * Helper: navigate from account to /lessen using client-side navigation.
 * This preserves the Pinia store state (including loggedInUser), unlike
 * page.goto() which triggers a full SSR reload and re-authentication.
 */
async function navigateToLessen(page: Page) {
    await page.locator('nav a.nav-item', { hasText: 'Les schema' }).click()
    await page.waitForURL('**/lessen', { timeout: 10_000 })
}

test.beforeEach(() => {
    if (!email || !password) {
        throw new Error('Set TEST_EMAIL and TEST_PASSWORD environment variables')
    }
})

test.describe('Authentication', () => {
    test('should log in and redirect to account page', async ({ page }) => {
        await login(page)

        // Verify the account page loaded with user content
        await expect(page.locator('text=Boekingen')).toBeVisible({ timeout: 10_000 })

        await logout(page)
    })
})

test.describe('Booking flow', () => {
    test('should log in and book the first available lesson', async ({ page }) => {
        // --- Step 1: Login ---
        await login(page)

        // --- Step 2: Navigate to lessons via client-side nav (preserves store state) ---
        await navigateToLessen(page)

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
        await logout(page)
    })

    test('should show error when user has no credits', async ({ page }) => {
        // This test validates that the server rejects bookings with insufficient credits.
        // It will only fail-as-expected if the test user has 0 credits.
        // If the user has credits, the test is skipped.
        await login(page)

        // Check credits — the account page shows "N lessen" (or "1 les") under "Saldo"
        const creditsText = await page.locator('text=/\\d+ les/i').textContent().catch(() => null)
        const credits = creditsText ? parseInt(creditsText.match(/(\d+)/)?.[1] ?? '0', 10) : null

        if (credits === null || credits > 0) {
            test.skip(true, 'User has credits — skipping no-credits test')
            return
        }

        await navigateToLessen(page)

        const bookButton = page.getByRole('button', { name: 'Boek' }).first()
        const hasBookButton = await bookButton.waitFor({ state: 'visible', timeout: 15_000 }).then(() => true).catch(() => false)

        if (!hasBookButton) {
            test.skip(true, 'No available lessons to test')
            return
        }

        await bookButton.click()

        // Should see an error about insufficient credits ("Onvoldoende credits")
        await expect(page.locator('text=/credit/i')).toBeVisible({ timeout: 10_000 })

        // --- Logout ---
        await logout(page)
    })
})
