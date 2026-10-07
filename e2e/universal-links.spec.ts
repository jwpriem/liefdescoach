/**
 * E2E test: the file iOS fetches to learn which links open the app.
 */

import { test, expect } from '@playwright/test'

test('the site serves the apple-app-site-association file as JSON', async ({ request }) => {
    const response = await request.get('/.well-known/apple-app-site-association')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('application/json')
    const body = await response.json()
    expect(body.applinks.details[0].appIDs).toEqual(['6DK95S2F4D.com.ravennah.app'])
})
