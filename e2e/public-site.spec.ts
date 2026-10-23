/**
 * E2E test: the public site offers one-time sessions and takes requests for them.
 *
 * Run against a throwaway Neon branch (recommended): yarn test:e2e:branch e2e/public-site.spec.ts
 */

import { test, expect } from '@playwright/test'

const OFFER_PAGES = [
    { path: '/vrijgezellenfeest', heading: /Yoga vrijgezellenfeest/, type: 'vrijgezellenfeest' },
    { path: '/bedrijfsyoga', heading: /Bedrijfsyoga/, type: 'bedrijfsyoga' },
    { path: '/teamuitje', heading: /Yoga teamuitje/, type: 'teamuitje' },
    { path: '/workshops', heading: /Yoga workshops/, type: 'workshop' },
    { path: '/events', heading: /Events & samenwerkingen/, type: 'event' },
]

test.describe('Public site', () => {
    test('the homepage links to every offer', async ({ page }) => {
        await page.goto('/')

        const offers = page.locator('#aanbod')
        for (const { path } of OFFER_PAGES) {
            await expect(offers.locator(`a[href="${path}"]`)).toBeVisible()
        }
        await expect(offers.locator('a[href="/priveles"]')).toBeVisible()
    })

    for (const offer of OFFER_PAGES) {
        test(`${offer.path} links to the request form with its type chosen`, async ({ page }) => {
            await page.goto(offer.path)

            await expect(page.getByRole('heading', { level: 1, name: offer.heading })).toBeVisible()
            await expect(page.getByRole('link', { name: 'Vraag een sessie aan' }).first()).toHaveAttribute(
                'href',
                `/aanvraag?type=${offer.type}`,
            )
        })
    }

    test('sends a request with the chosen type', async ({ page }) => {
        // Answer for the mail endpoint so no email leaves the test
        let sent: any
        await page.route('**/api/mail/send', async (route) => {
            sent = route.request().postDataJSON()
            await route.fulfill({ json: { success: true } })
        })

        await page.goto('/aanvraag?type=teamuitje')
        await expect(page.getByRole('combobox').first()).toHaveText(/Teamuitje/)

        await page.getByPlaceholder('Je naam').fill('Bea de Vries')
        await page.getByPlaceholder('Je e-mailadres').fill('bea@example.test')
        await page.getByPlaceholder('Bijv. 12').fill('14')
        await page.getByRole('button', { name: 'Aanvraag versturen' }).click()

        await expect(page.getByText('Bedankt voor je aanvraag!')).toBeVisible()
        expect(sent).toMatchObject({
            type: 'session-request',
            data: { type: 'teamuitje', name: 'Bea de Vries', email: 'bea@example.test', participants: '14' },
        })
    })

    for (const path of ['/bo-bol', '/eerste-les']) {
        test(`${path} redirects to the homepage`, async ({ page }) => {
            await page.goto(path)

            await expect(page).toHaveURL(/\/$/)
        })
    }
})
