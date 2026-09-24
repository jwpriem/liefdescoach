/**
 * E2E test: Login and book a lesson.
 *
 * Run against a throwaway Neon branch (recommended): yarn test:e2e:branch
 * Credentials default to the seeded e2e student; override with TEST_EMAIL / TEST_PASSWORD.
 */

import { test, expect, Page } from '@playwright/test'
import { E2E_PASSWORD, E2E_STUDENT } from './fixtures'
import { login as loginAs, logout } from './helpers'

const email = process.env.TEST_EMAIL ?? E2E_STUDENT.email
const password = process.env.TEST_PASSWORD ?? E2E_PASSWORD

const login = (page: Page) => loginAs(page, email, password)

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
    const saldoRow = page.locator('span:has-text("Saldo"):visible').locator('..')
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

        // Open "Mijn lessen" tab to see credits and bookings
        await page.getByText('Mijn lessen').click()

        // --- Step 2: Read current credits on the account page ---
        const creditsBefore = await getCredits(page)

        if (creditsBefore < 1) {
            test.skip(true, `User has ${creditsBefore} credits — need at least 1 to book`)
            return
        }

        // --- Step 3: Open booking modal ---
        // Ensure we click the visible button (there might be one in hidden tabs)
        await page.locator('button:has-text("Boek een les"):visible').first().click()
        await expect(page.locator('.fixed.inset-0')).toBeVisible() // Modal overlay

        // --- Step 4: Find and click the first available "Boek" button inside the modal ---
        // Wait for lessons to load in modal
        await page.waitForTimeout(1000)
        const bookButton = page.getByRole('button', { name: 'Boek', exact: true }).first()
        const hasBookButton = await bookButton.waitFor({ state: 'visible', timeout: 15_000 }).then(() => true).catch(() => false)

        if (!hasBookButton) {
            test.skip(true, 'No available lessons to book (all full or already booked)')
            return
        }

        // Count existing "Geboekt" elements before booking
        const geboektBefore = await page.locator('text=Geboekt').count()

        await bookButton.click()

        // --- Step 5: Verify booking succeeded ---
        // Wait for the number of "Geboekt" elements to increase by one
        try {
            await expect(async () => {
                const geboektAfter = await page.locator('text=Geboekt').count()
                expect(geboektAfter).toBe(geboektBefore + 1)
            }).toPass({ timeout: 15_000 })
        } catch (e) {
            // Debug: log page state
            console.log('DEBUG: Booking verification timed out — "Geboekt" count did not increase.')
            throw e
        }

        // --- Step 6: Verify credits decreased by 1 ---
        // Close modal by clicking backdrop (top-left corner to avoid content)
        await page.locator('.fixed.inset-0').first().click({ position: { x: 10, y: 10 } })

        // Wait for modal to close
        await expect(page.locator('.fixed.inset-0')).not.toBeVisible()

        const creditsAfter = await getCredits(page)
        expect(creditsAfter).toBe(creditsBefore - 1)

        // --- Step 7: Verify booking appears on account page ---
        await expect(page.locator('text=Boekingen')).toBeVisible({ timeout: 10_000 })

        // --- Step 8: Logout ---
        await logout(page)
    })
})
