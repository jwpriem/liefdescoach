import { defineConfig } from '@playwright/test'
import dotenv from 'dotenv'

// Load .env so TEST_EMAIL, TEST_PASSWORD etc. are available
dotenv.config()

export default defineConfig({
    testDir: './e2e',
    timeout: 60_000,
    retries: 0,
    use: {
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
        headless: true,
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' },
            testIgnore: /app-mode\.spec\.ts/,
        },
        // The iOS bundle in a browser; only when the runner serves it (yarn test:e2e:branch --app)
        ...(process.env.APP_BASE_URL
            ? [{
                name: 'app',
                use: { browserName: 'chromium' as const, baseURL: process.env.APP_BASE_URL },
                testMatch: /app-mode\.spec\.ts/,
            }]
            : []),
    ],
})
