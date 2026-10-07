/**
 * E2E smoke test of the iOS bundle, served on its own origin in a browser.
 * It exercises what the iPhone app does: cross-origin API calls with a session token.
 *
 * Run: yarn test:e2e:branch --app
 */

import { test, expect } from '@playwright/test'
import { E2E_PASSWORD, E2E_STUDENT } from './fixtures'
import { bookFirstAvailableLesson } from './helpers'

const email = process.env.TEST_EMAIL ?? E2E_STUDENT.email
const password = process.env.TEST_PASSWORD ?? E2E_PASSWORD
const accountNav = (page: import('@playwright/test').Page) =>
    page.locator('nav').getByRole('button', { name: 'Boekingen', exact: true })

test('the app logs in with a token, stays signed in, books a lesson and logs out', async ({ page, context }) => {
    // The app opens at its root and lands on the login page
    await page.goto('/')
    await page.waitForURL('**/login', { timeout: 15_000 })

    // Password first: passkeys are not offered in the app
    await expect(page.locator('#password')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('passkey', { exact: false })).toHaveCount(0)
    // Only member links in the navigation
    await expect(page.getByRole('link', { name: 'Tarieven' })).toHaveCount(0)

    await page.fill('#email', email)
    await page.fill('#password', password)
    await page.getByRole('button', { name: 'Inloggen', exact: true }).click()
    await page.waitForURL('**/account', { timeout: 15_000 })
    await expect(accountNav(page)).toBeVisible({ timeout: 10_000 })

    // The session is a token, not a cookie
    expect((await context.cookies()).map((c) => c.name)).not.toContain('rav_session')

    // A cold start keeps the user signed in
    await page.goto('/')
    await page.waitForURL('**/account', { timeout: 15_000 })
    await expect(accountNav(page)).toBeVisible({ timeout: 10_000 })

    await bookFirstAvailableLesson(page)
    // After a booking the app offers to put the lesson in the calendar (the toast stays for 15 seconds)
    await expect(page.getByText('Zet de les in je agenda', { exact: true })).toBeVisible({ timeout: 10_000 })

    // A link that leaves the member area opens the website instead of a 404
    await page.goto('/lessen')
    const lessonInfo = page.locator('a[href="/hatha-yoga"]').first()
    await expect(lessonInfo).toBeVisible({ timeout: 10_000 })
    const [website] = await Promise.all([page.waitForEvent('popup'), lessonInfo.click()])
    await website.waitForURL(`${process.env.BASE_URL}/hatha-yoga`, { timeout: 10_000 })
    await website.close()
    await expect(page).toHaveURL(/\/lessen$/)
    await expect(page.getByText('Pagina niet gevonden')).toHaveCount(0)

    // Logout drops the token: a cold start lands on the login page again
    await page.locator('nav').getByText('Logout', { exact: true }).click()
    await page.waitForURL('**/login', { timeout: 10_000 })
    await page.goto('/')
    await page.waitForURL('**/login', { timeout: 15_000 })
})
