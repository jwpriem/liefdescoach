/**
 * E2E test: Registration flow with randomized Dutch user data.
 *
 * This test creates a new user with randomly generated Dutch names,
 * email addresses, and optionally fills phone, date of birth, and injury fields.
 *
 * Run:
 *   yarn test:e2e
 *   yarn dlx playwright test e2e/registration.spec.ts
 */

import { test, expect, Page } from '@playwright/test'

// Dutch first names (mixed male/female)
const DUTCH_FIRST_NAMES = [
    // Female
    'Emma', 'Julia', 'Sophie', 'Lotte', 'Anna', 'Lisa', 'Eva', 'Sanne', 'Fleur', 'Iris',
    'Noa', 'Evi', 'Mila', 'Tessa', 'Sara', 'Nina', 'Lieke', 'Roos', 'Femke', 'Britt',
    // Male
    'Daan', 'Sem', 'Lucas', 'Levi', 'Finn', 'Milan', 'Jesse', 'Luuk', 'Bram', 'Tim',
    'Thijs', 'Jayden', 'Ruben', 'Lars', 'Max', 'Thomas', 'Stijn', 'Noah', 'Julian', 'Bas'
]

// Dutch last names
const DUTCH_LAST_NAMES = [
    'De Jong', 'Jansen', 'De Vries', 'Van den Berg', 'Van Dijk', 'Bakker', 'Janssen',
    'Visser', 'Smit', 'Meijer', 'De Boer', 'Mulder', 'De Groot', 'Bos', 'Vos',
    'Peters', 'Hendriks', 'Van Leeuwen', 'Dekker', 'Brouwer', 'De Wit', 'Dijkstra',
    'Smits', 'De Graaf', 'Van der Meer'
]

const EMAIL_DOMAINS = ['@hotmail.com', '@gmail.com']

// Sample injury/note texts in Dutch
const INJURY_TEXTS = [
    'Lage rugpijn door lang zitten',
    'Herstellend van knieblessure',
    'Nekproblemen, voorzichtig met hoofdstand',
    'Zwangerschapsyoga gewenst',
    'Beginneling, nog niet zo flexibel'
]

function randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function randomBool(chance = 0.5): boolean {
    return Math.random() < chance
}

function generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let password = ''
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
}

function generateRandomDateOfBirth(): string {
    // Random age between 18 and 65
    const age = 18 + Math.floor(Math.random() * 47)
    const now = new Date()
    const birthYear = now.getFullYear() - age
    const birthMonth = Math.floor(Math.random() * 12) + 1
    const birthDay = Math.floor(Math.random() * 28) + 1
    return `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`
}

function generateRandomPhone(): string {
    // Dutch mobile format: 06 XXXX XXXX
    const digits = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('')
    return `06${digits}`
}

interface TestUser {
    firstName: string
    lastName: string
    fullName: string
    email: string
    password: string
    phone: string | null
    dateOfBirth: string | null
    injury: string | null
}

function generateTestUser(): TestUser {
    const firstName = randomChoice(DUTCH_FIRST_NAMES)
    const lastName = randomChoice(DUTCH_LAST_NAMES)
    const normalizedLastName = lastName.toLowerCase().replace(/\s+/g, '')
    const randomNum = Math.floor(Math.random() * 1000)
    const domain = randomChoice(EMAIL_DOMAINS)

    return {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${normalizedLastName}${randomNum}${domain}`,
        password: generateRandomPassword(),
        phone: randomBool(0.5) ? generateRandomPhone() : null,
        dateOfBirth: randomBool(0.5) ? generateRandomDateOfBirth() : null,
        injury: randomBool(0.5) ? randomChoice(INJURY_TEXTS) : null
    }
}

async function register(page: Page, user: TestUser) {
    await page.goto('/login')
    await page.waitForSelector('#email')

    // Switch to register form
    await page.click('button:has-text("Registreren")', { strict: false })

    // Wait for register form fields
    await page.waitForSelector('#name')

    // Fill required fields
    await page.fill('#email', user.email)
    await page.fill('#password', user.password)
    await page.fill('#name', user.fullName)

    // Fill optional phone
    if (user.phone) {
        await page.fill('#phone', user.phone)
    }

    // Fill optional date of birth
    if (user.dateOfBirth) {
        await page.fill('#dateOfBirth', user.dateOfBirth)
    }

    // Fill optional injury/notes
    if (user.injury) {
        await page.fill('#injury', user.injury)
    }

    // Submit registration
    await page.click('button:has-text("Account aanmaken")')
}

test.describe('Registration flow', () => {
    test('should register a new user with randomized data and redirect to account', async ({ page }) => {
        const user = generateTestUser()

        console.log(`Registering test user: ${user.fullName} (${user.email})`)
        console.log(`  Phone: ${user.phone ?? 'not provided'}`)
        console.log(`  DOB: ${user.dateOfBirth ?? 'not provided'}`)
        console.log(`  Injury: ${user.injury ?? 'not provided'}`)

        await register(page, user)

        // Verify redirect to account page (detect server errors early)
        const errorOrRedirect = await Promise.race([
            page.waitForURL('**/account', { timeout: 20_000 }).then(() => 'redirected' as const),
            page.locator('text=Server Error').waitFor({ state: 'visible', timeout: 20_000 }).then(() => 'error' as const)
        ])
        if (errorOrRedirect === 'error') {
            throw new Error('Registration failed with a Server Error — the API endpoint may be down or misconfigured')
        }

        // Verify user name displays correctly
        await expect(page.locator('text=Mijn gegevens')).toBeVisible({ timeout: 10_000 })
        await expect(page.getByRole('link', { name: user.fullName })).toBeVisible({ timeout: 10_000 })

        // Verify welcome credit was granted (should show "1 les")
        await expect(page.locator('text=1 les').or(page.locator('text=lessen'))).toBeVisible({ timeout: 10_000 })

        // If date of birth was provided, verify it's displayed (or shows "Niet opgegeven" otherwise)
        await expect(page.locator('text=Geboortedatum')).toBeVisible({ timeout: 5_000 })

        // If injury was provided, check medical section
        if (user.injury) {
            await expect(page.locator('text=Medische info')).toBeVisible({ timeout: 5_000 })
        }

        // Logout to clean up session
        await page.locator('nav').getByText('Logout', { exact: true }).click()
        await page.waitForURL('**/', { timeout: 10_000 })
    })

    test('should register minimum required fields only', async ({ page }) => {
        const firstName = randomChoice(DUTCH_FIRST_NAMES)
        const lastName = randomChoice(DUTCH_LAST_NAMES)
        const normalizedLastName = lastName.toLowerCase().replace(/\s+/g, '')
        const randomNum = Math.floor(Math.random() * 1000)
        const domain = randomChoice(EMAIL_DOMAINS)

        const minimalUser: TestUser = {
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`,
            email: `minimal.${normalizedLastName}${randomNum}${domain}`,
            password: generateRandomPassword(),
            phone: null,
            dateOfBirth: null,
            injury: null
        }

        console.log(`Registering minimal user: ${minimalUser.fullName} (${minimalUser.email})`)

        await register(page, minimalUser)

        // Verify redirect to account page (detect server errors early)
        const errorOrRedirect = await Promise.race([
            page.waitForURL('**/account', { timeout: 20_000 }).then(() => 'redirected' as const),
            page.locator('text=Server Error').waitFor({ state: 'visible', timeout: 20_000 }).then(() => 'error' as const)
        ])
        if (errorOrRedirect === 'error') {
            throw new Error('Registration failed with a Server Error — the API endpoint may be down or misconfigured')
        }

        // Verify user name displays correctly
        await expect(page.getByRole('link', { name: minimalUser.fullName })).toBeVisible({ timeout: 10_000 })

        // Verify empty states for optional fields
        await expect(page.locator('text=Geen telefoonnummer')).toBeVisible({ timeout: 5_000 })
        await expect(page.locator('text=Niet opgegeven')).toBeVisible({ timeout: 5_000 }) // Date of birth empty state

        // Logout
        await page.locator('nav').getByText('Logout', { exact: true }).click()
        await page.waitForURL('**/', { timeout: 10_000 })
    })
})
