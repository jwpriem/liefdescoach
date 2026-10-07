import { Page, expect } from '@playwright/test'

/** Password login through the passkey-first login page. */
export async function login(page: Page, email: string, password: string) {
    await page.goto('/login')

    const otherOptions = page.getByRole('button', { name: 'Andere manier gebruiken' })
    const usePassword = page.getByRole('button', { name: 'Wachtwoord gebruiken' })
    await expect(otherOptions.or(usePassword).first()).toBeVisible({ timeout: 30_000 })
    if (await otherOptions.isVisible()) await otherOptions.click()
    await usePassword.click()

    await page.fill('#email', email)
    await page.fill('#password', password)
    await page.getByRole('button', { name: 'Inloggen', exact: true }).click()
    await page.waitForURL('**/account', { timeout: 15_000 })
}

/** Switch tabs on /account via the bottom navigation (Dashboard, Boekingen, Credits, Instellingen, …). */
export async function openAccountTab(page: Page, label: string) {
    await page.locator('nav').getByRole('button', { name: label, exact: true }).click()
}

export async function logout(page: Page) {
    await page.locator('nav').getByText('Logout', { exact: true }).click()
    await page.waitForURL('**/', { timeout: 10_000 })
}

/** On /account: opens the booking modal and books the first available lesson. Leaves the modal open. */
export async function bookFirstAvailableLesson(page: Page) {
    await openAccountTab(page, 'Boekingen')
    // Ensure we click the visible button (there might be one in hidden tabs)
    await page.locator('button:has-text("Boek een les"):visible').first().click()
    await expect(page.locator('.fixed.inset-0')).toBeVisible() // Modal overlay

    // Wait for lessons to load in modal
    await page.waitForTimeout(1000)
    // Accessible name is the aria-label "Boek <lesson title> op <date>"
    const bookButton = page.getByRole('button', { name: /^Boek .+ op / }).first()
    await expect(bookButton, 'the seeded e2e lessons have free spots').toBeVisible({ timeout: 15_000 })

    const geboektBefore = await page.locator('text=Geboekt').count()
    await bookButton.click()

    await expect(async () => {
        expect(await page.locator('text=Geboekt').count()).toBe(geboektBefore + 1)
    }, 'the "Geboekt" count goes up by one').toPass({ timeout: 15_000 })
}
