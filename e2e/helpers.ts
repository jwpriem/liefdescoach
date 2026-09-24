import { Page, expect } from '@playwright/test'

/** Password login through the passkey-first login page. */
export async function login(page: Page, email: string, password: string) {
    await page.goto('/login')

    const otherOptions = page.getByRole('button', { name: 'Andere manier gebruiken' })
    const usePassword = page.getByRole('button', { name: 'Wachtwoord gebruiken' })
    await expect(otherOptions.or(usePassword).first()).toBeVisible({ timeout: 10_000 })
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
