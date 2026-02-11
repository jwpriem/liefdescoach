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
 *   TEST_EMAIL=x@y.com TEST_PASSWORD=secret yarn dlx playwright test
 *   yarn test:e2e   (reads from .env)
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
    await page.click('button:has-text("Inloggen")')

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
    await page.locator('nav').getByText('Logout', { exact: true }).click()
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

/**
 * Parse the credit count from the "Saldo" row on the account page.
 * The row renders as: "<N> les" (1 credit) or "<N> lessen" (0 or 2+).
 */
async function getCredits(page: Page): Promise<number> {
    const saldoRow = page.locator('text=Saldo').locator('..')
    await expect(saldoRow).toBeVisible({ timeout: 10_000 })

    const saldoText = await saldoRow.locator('span.block').innerText()
    const match = saldoText.match(/^(\d+)\s+less?en?$/)
    if (!match) {
        throw new Error(`Could not parse credit count from: "${saldoText}"`)
    }
    return parseInt(match[1], 10)
}

test.describe('Booking flow', () => {
    test('should log in, verify credits, book a lesson, and verify credits decreased', async ({ page }) => {
        // --- Step 1: Login ---
        await login(page)

        // --- Step 2: Read current credits on the account page ---
        const creditsBefore = await getCredits(page)

        if (creditsBefore < 1) {
            test.skip(true, `User has ${creditsBefore} credits — need at least 1 to book`)
            return
        }

        // --- Step 3: Navigate to lessons via client-side nav (preserves store state) ---
        await navigateToLessen(page)

        // --- Step 4: Find and click the first available "Boek" button ---
        const bookButton = page.getByRole('button', { name: 'Boek', exact: true }).first()
        const hasBookButton = await bookButton.waitFor({ state: 'visible', timeout: 15_000 }).then(() => true).catch(() => false)

        if (!hasBookButton) {
            test.skip(true, 'No available lessons to book (all full or already booked)')
            return
        }

        await bookButton.click()

        // --- Step 5: Verify booking succeeded ---
        // The toast notification "Je les is geboekt!" should appear
        await expect(page.locator('text=Je les is geboekt!')).toBeVisible({ timeout: 15_000 })

        // The "Boek" button should have changed to "Geboekt" for this lesson
        await expect(page.locator('text=Geboekt').first()).toBeVisible({ timeout: 10_000 })

        // --- Step 6: Navigate to account page and verify credits decreased by 1 ---
        await page.locator('nav a.nav-item[href="/account"]').click()
        await page.waitForURL('**/account', { timeout: 10_000 })

        const creditsAfter = await getCredits(page)
        expect(creditsAfter).toBe(creditsBefore - 1)

        // --- Step 7: Verify booking appears on account page ---
        await expect(page.locator('text=Boekingen')).toBeVisible({ timeout: 10_000 })

        // --- Step 8: Logout ---
        await logout(page)
    })
})
