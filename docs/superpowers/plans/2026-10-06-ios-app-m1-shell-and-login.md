# iOS App Milestone 1 — App Shell and Login — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Capacitor iOS app that bundles the member area of the Nuxt app, logs in with a session token against the existing API, and can book a lesson in the simulator — with the website behaving exactly as before.

**Architecture:** One codebase, two build targets. `APP_TARGET=ios nuxt generate` produces a client-only bundle (member pages only) that Capacitor ships in the app. The server recognises app requests by their `Origin` header and, for those only, reads the session from an `Authorization: Bearer` header, skips CSRF, and answers CORS. The existing global `$fetch` wrapper becomes the single API plugin that adds the API base and the token inside the app.

**Tech Stack:** Nuxt 4, Nitro/h3, Drizzle, Vitest, Playwright, Capacitor 8 (Swift Package Manager), `capacitor-secure-storage-plugin` (iOS Keychain).

**Spec:** `docs/superpowers/specs/2026-10-06-ios-app-design.md` (sections 1, 2, 6 and milestone 1 of section 7). Milestones 2–5 get their own plans.

## Global Constraints

- The website's behaviour must not change: cookie sessions, CSRF enforcement and same-origin-only `/api/**` stay as they are for every origin except the app origin.
- App origin: `capacitor://localhost`, held in runtime config `appOrigin` (`NUXT_APP_ORIGIN`) so tests can override it.
- API base in the shipped app: `https://www.ravennah.com` (the apex `ravennah.com` does not answer; do not use it).
- Bundle ID `com.ravennah.app`, app name `Yoga Ravennah`.
- The app contains member pages only: `/login`, `/lessen`, `/account`, `/archief`, `/admin/**`, `/verify-email`, `/reset-wachtwoord`.
- No Google Tag Manager, no PWA service worker, no sitemap module in the iOS bundle.
- Passkey login and passkey settings are hidden in the app.
- UI text is Dutch.
- Local runs use the Neon `dev` branch or a throwaway `e2e-*` branch. Never production. Never put `NUXT_DATABASE_URL` in `.env`.
- DRY: no copied code. Tests are written before the code they cover. Run `yarn test:unit` before deleting or moving any existing code.
- No database migration in this milestone.
- Work on a new branch `feature/ios-app` created from `master`.

## Deviation from the spec

The spec promises `yarn dev:ios` with live reload. This plan delivers `yarn dev:ios` **without** live reload: it builds the bundle against the local `yarn dev` server and runs it in the simulator. Reason: app requests are recognised by a cross-origin `Origin` header, and live reload would load the UI from the dev server itself (same origin), so the token path would not be exercised. UI work keeps using `yarn dev` in a browser, as today.

## Review Focus

1. A bearer token sent from any origin other than the app's must be ignored (otherwise a website script could use a leaked token and bypass CSRF) — test in Task 3.
2. An app request that carries a valid website cookie but no token must be unauthenticated — test in Task 3.
3. A stored token the server no longer accepts must be cleared at launch so the user lands on the login page, not in a loop — test in Task 6.
4. A 401 that is not about the session (wrong password on login, wrong current password) must not wipe a valid stored token — test in Task 6.
5. A preflight from an unknown origin must get no CORS grant — test in Task 5.

## File Structure

| File | Responsibility |
|---|---|
| `config/ios-target.ts` (new) | Which pages the iOS bundle contains; pure function |
| `app/native/external.vue` (new) | Empty page behind the catch-all route |
| `app/composables/useNativeApp.ts` (new) | The one place that answers "am I inside the iOS app?" |
| `nuxt.config.ts` | Reads `APP_TARGET`, switches the iOS target |
| `server/utils/native-app.ts` (new) | `isNativeAppRequest`, `getBearerToken`, header name |
| `server/utils/auth-session.ts` | Cookie or bearer session, renewal for app sessions |
| `server/utils/csrf.ts` | Skips CSRF for app requests |
| `server/middleware/app-cors.ts` (new) | CORS and preflight for the app origin |
| `app/utils/apiHooks.ts` (new) | Pure request/response hooks for the app |
| `app/utils/sessionTokenStore.ts` (new) | Token in the Keychain |
| `app/plugins/api.client.ts` (renamed from `csrf.client.ts`) | Single `$fetch` wrapper for web and app |
| `app/middleware/external.global.ts` (new) | Non-member links open the website |
| `scripts/serve-ios-bundle.ts` (new) | Static server for the app-mode e2e run |
| `e2e/app-mode.spec.ts` (new) | Smoke test of the bundle in a browser |
| `capacitor.config.ts`, `ios/` (new) | The native project |

---

### Task 1: iOS build target

**Files:**
- Create: `config/ios-target.ts`, `config/ios-target.test.ts`, `app/native/external.vue`, `app/composables/useNativeApp.ts`
- Modify: `nuxt.config.ts`, `vitest.config.ts`, `package.json`, `.gitignore`, `server/plugins/env-check.ts`

**Interfaces:**
- Produces: `toIosPages(pages: NuxtPage[], externalPageFile: string): NuxtPage[]`, `EXTERNAL_ROUTE_NAME = 'external'`, `useNativeApp(): { isNativeApp: boolean; apiBase: string }`, runtime config `appOrigin` (private), `public.apiBase`, `public.nativeApp`, script `yarn build:ios:bundle` writing to `.output-ios/public`.

- [ ] **Step 1: Create the branch**

```bash
git checkout master && git pull && git checkout -b feature/ios-app
```

- [ ] **Step 2: Let Vitest find tests in `config/` and `app/`**

In `vitest.config.ts` replace the `include` line with:

```ts
    include: ['server/**/*.test.ts', 'app/**/*.test.ts', 'config/**/*.test.ts', 'plugins/**/*.test.ts', 'stores/**/*.test.ts', 'scripts/**/*.test.ts'],
```

- [ ] **Step 3: Write the failing test**

Create `config/ios-target.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { EXTERNAL_ROUTE_NAME, toIosPages } from './ios-target'

const page = (path: string) => ({ path, file: `/pages${path}.vue` })

describe('toIosPages', () => {
  const result = toIosPages(
    [page('/'), page('/tarieven'), page('/lessen'), page('/lessen-info'), page('/login'), page('/account'),
      page('/archief'), page('/admin/users/:id()'), page('/verify-email'), page('/reset-wachtwoord'), page('/contact')],
    '/abs/external.vue',
  )
  const paths = result.map((p) => p.path)

  it('keeps every member page', () => {
    expect(paths).toEqual(expect.arrayContaining([
      '/lessen', '/login', '/account', '/archief', '/admin/users/:id()', '/verify-email', '/reset-wachtwoord',
    ]))
  })

  it('drops marketing pages, including ones that only share a prefix', () => {
    expect(paths).not.toContain('/tarieven')
    expect(paths).not.toContain('/contact')
    expect(paths).not.toContain('/lessen-info')
  })

  it('redirects the root to the account page', () => {
    expect(result.find((p) => p.path === '/')).toEqual({ path: '/', redirect: '/account' })
  })

  it('adds a catch-all route for links that leave the member area', () => {
    expect(result.at(-1)).toEqual({ name: EXTERNAL_ROUTE_NAME, path: '/:path(.*)*', file: '/abs/external.vue' })
  })
})
```

- [ ] **Step 4: Run it and see it fail**

Run: `yarn vitest run config/ios-target.test.ts`
Expected: FAIL — cannot resolve `./ios-target`.

- [ ] **Step 5: Implement**

Create `config/ios-target.ts`:

```ts
import type { NuxtPage } from 'nuxt/schema'

/** Route prefixes of the member area — the only pages bundled into the iOS app. */
const MEMBER_ROUTE_PREFIXES = ['/login', '/lessen', '/account', '/archief', '/admin', '/verify-email', '/reset-wachtwoord']

/** Name of the catch-all route that stands in for every page the app does not contain. */
export const EXTERNAL_ROUTE_NAME = 'external'

function isMemberPage(page: NuxtPage): boolean {
  return MEMBER_ROUTE_PREFIXES.some((prefix) => page.path === prefix || page.path.startsWith(`${prefix}/`))
}

export function toIosPages(pages: NuxtPage[], externalPageFile: string): NuxtPage[] {
  return [
    ...pages.filter(isMemberPage),
    { path: '/', redirect: '/account' },
    { name: EXTERNAL_ROUTE_NAME, path: '/:path(.*)*', file: externalPageFile },
  ]
}
```

- [ ] **Step 6: Run it and see it pass**

Run: `yarn vitest run config/ios-target.test.ts`
Expected: 4 passed.

- [ ] **Step 7: Add the catch-all page and the composable**

Create `app/native/external.vue`:

```vue
<template>
  <div />
</template>
```

Create `app/composables/useNativeApp.ts`:

```ts
/** The one place that knows whether this bundle runs inside the iOS app. */
export const useNativeApp = () => {
  const { nativeApp, apiBase } = useRuntimeConfig().public
  return { isNativeApp: nativeApp === true, apiBase: apiBase as string }
}
```

- [ ] **Step 8: Switch the iOS target in `nuxt.config.ts`**

Make these seven edits.

1. Replace the first three lines

```ts
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
```

with

```ts
import { fileURLToPath } from 'node:url'
import { toIosPages } from './config/ios-target'

// APP_TARGET=ios builds the client-only bundle that ships inside the iOS app (yarn build:ios)
const iosTarget = process.env.APP_TARGET === 'ios'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  // Own build and output dirs so an iOS build never disturbs a running `yarn dev`
  ...(iosTarget ? { ssr: false, buildDir: '.nuxt-ios' } : {}),
```

2. In `app.head`, change `      script: [` to `      script: iosTarget ? [] : [`.
3. In `app.head`, change `      noscript: [` to `      noscript: iosTarget ? [] : [`.
4. In `runtimeConfig`, directly after the `sessionSecret` line add:

```ts
    appOrigin: 'capacitor://localhost', // NUXT_APP_ORIGIN (Origin the iOS app sends; those requests use token auth)
```

5. In `runtimeConfig.public`, directly after the `vapidPublicKey` line add:

```ts
      apiBase: '',                // NUXT_PUBLIC_API_BASE (empty on the web; the site URL inside the iOS bundle)
      nativeApp: iosTarget,       // true only in the iOS bundle
```

6. Replace the `modules` array with:

```ts
  modules: [
    '@nuxt/fonts',
    'dayjs-nuxt',
    '@nuxt/ui',
    // Web only: the app has no service worker and no sitemap
    ...(iosTarget ? [] : ['@nuxtjs/sitemap', '@vite-pwa/nuxt']),
  ],

  hooks: {
    'pages:extend'(pages) {
      if (!iosTarget) return
      const externalPage = fileURLToPath(new URL('./app/native/external.vue', import.meta.url))
      pages.splice(0, pages.length, ...toIosPages(pages, externalPage))
    },
  },
```

7. Change `  nitro: {` to:

```ts
  nitro: {
    ...(iosTarget ? { output: { dir: '.output-ios' } } : {}),
```

- [ ] **Step 9: Let the static build boot without a database**

`nuxt generate` starts Nitro to prerender, and `server/plugins/env-check.ts` throws without `NUXT_DATABASE_URL`. Replace the plugin body's first line so the file reads:

```ts
export default defineNitroPlugin(() => {
    // Prerendering (nuxt generate, used for the iOS bundle) serves no API requests
    if (import.meta.prerender) return

    const required: string[] = [
```

(the rest of the file is unchanged).

- [ ] **Step 10: Add the script and ignore the build dirs**

In `package.json` `scripts`, after `"generate"` add:

```json
    "build:ios:bundle": "APP_TARGET=ios nuxt generate",
```

In `.gitignore`, under `# Nuxt dev/build outputs`, add two lines:

```
.nuxt-ios
.output-ios
```

- [ ] **Step 11: Build the bundle and check it**

Run:

```bash
NUXT_PUBLIC_API_BASE=http://localhost:3000 yarn build:ios:bundle
ls .output-ios/public/index.html
grep -c googletagmanager .output-ios/public/index.html
ls .output-ios/public | grep -c -E '^sw\.js$|^sitemap'
```

Expected: the build finishes; `index.html` is listed; both counts print `0`.

- [ ] **Step 12: Check the website build and the unit suite are intact**

Run: `yarn test:unit`
Expected: all tests pass (the 4 new ones included).

Run: `yarn nuxt prepare`
Expected: finishes without errors (the web config still loads).

- [ ] **Step 13: Commit**

```bash
git add config app/native app/composables/useNativeApp.ts nuxt.config.ts vitest.config.ts package.json .gitignore server/plugins/env-check.ts
git commit -m "Add iOS build target: client-only bundle of the member pages"
```

---

### Task 2: Recognise app requests on the server

**Files:**
- Create: `server/utils/native-app.ts`, `server/utils/native-app.test.ts`

**Interfaces:**
- Consumes: runtime config `appOrigin` (Task 1).
- Produces: `isNativeAppRequest(event: H3Event): boolean`, `getBearerToken(event: H3Event): string | null`, `SESSION_TOKEN_HEADER = 'x-session-token'`.

- [ ] **Step 1: Write the failing test**

Create `server/utils/native-app.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const testState = vi.hoisted(() => ({ headers: new Map<string, string>() }))

vi.mock('h3', () => ({
  createError: (opts: any) => Object.assign(new Error(opts.statusMessage), opts),
  getHeader: vi.fn((_: any, name: string) => testState.headers.get(name.toLowerCase())),
}))

import { getBearerToken, isNativeAppRequest } from './native-app'

const event = {} as any

beforeEach(() => {
  testState.headers.clear()
  vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({ appOrigin: 'capacitor://localhost', public: {} }))
})

describe('isNativeAppRequest', () => {
  it('is true when the Origin is the app origin', () => {
    testState.headers.set('origin', 'capacitor://localhost')
    expect(isNativeAppRequest(event)).toBe(true)
  })

  it('is false for the website and for other origins', () => {
    testState.headers.set('origin', 'https://www.ravennah.com')
    expect(isNativeAppRequest(event)).toBe(false)
    testState.headers.set('origin', 'https://attacker.test')
    expect(isNativeAppRequest(event)).toBe(false)
  })

  it('is false without an Origin header', () => {
    expect(isNativeAppRequest(event)).toBe(false)
  })

  it('is false when no app origin is configured, even for an empty Origin', () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({ appOrigin: '', public: {} }))
    testState.headers.set('origin', '')
    expect(isNativeAppRequest(event)).toBe(false)
  })
})

describe('getBearerToken', () => {
  it('returns the token from a Bearer header', () => {
    testState.headers.set('authorization', 'Bearer abc123')
    expect(getBearerToken(event)).toBe('abc123')
  })

  it('returns null for a missing header or another scheme', () => {
    expect(getBearerToken(event)).toBeNull()
    testState.headers.set('authorization', 'Basic abc123')
    expect(getBearerToken(event)).toBeNull()
  })
})
```

- [ ] **Step 2: Run it and see it fail**

Run: `yarn vitest run server/utils/native-app.test.ts`
Expected: FAIL — cannot resolve `./native-app`.

- [ ] **Step 3: Implement**

Create `server/utils/native-app.ts`:

```ts
import { getHeader, type H3Event } from 'h3'

/** Response header that hands a fresh session token to the iOS app. */
export const SESSION_TOKEN_HEADER = 'x-session-token'

/**
 * True for requests from the iOS app, recognised by its Origin.
 * A browser never lets a website send this Origin, so these requests can safely
 * use token auth and skip CSRF.
 */
export function isNativeAppRequest(event: H3Event): boolean {
  const { appOrigin } = useRuntimeConfig(event)
  return !!appOrigin && getHeader(event, 'origin') === appOrigin
}

export function getBearerToken(event: H3Event): string | null {
  return getHeader(event, 'authorization')?.match(/^Bearer (\S+)$/)?.[1] ?? null
}
```

- [ ] **Step 4: Run it and see it pass**

Run: `yarn vitest run server/utils/native-app.test.ts`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add server/utils/native-app.ts server/utils/native-app.test.ts
git commit -m "Recognise requests from the iOS app by their Origin"
```

---

### Task 3: Token sessions next to cookie sessions

**Files:**
- Modify: `server/utils/auth-session.ts`
- Create: `server/utils/auth-session.test.ts`

**Interfaces:**
- Consumes: `isNativeAppRequest`, `getBearerToken`, `SESSION_TOKEN_HEADER` from `./native-app` (Task 2).
- Produces: unchanged signatures `createSession(event, userId): Promise<string>`, `getSessionUser(event)`, `destroySession(event): Promise<void>`. For app requests `createSession` sets the `x-session-token` response header instead of a cookie.

- [ ] **Step 1: Write the failing tests**

Create `server/utils/auth-session.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueuedDb } from '../test-utils'

const testState = vi.hoisted(() => ({
  headers: new Map<string, string>(),
  cookies: new Map<string, string>(),
  responseHeaders: new Map<string, string>(),
  setCookie: vi.fn(),
  deleteCookie: vi.fn(),
}))

vi.mock('h3', () => ({
  createError: (opts: any) => Object.assign(new Error(opts.statusMessage), opts),
  getCookie: vi.fn((_: any, name: string) => testState.cookies.get(name)),
  getHeader: vi.fn((_: any, name: string) => testState.headers.get(name.toLowerCase())),
  setCookie: testState.setCookie,
  deleteCookie: testState.deleteCookie,
  setResponseHeader: vi.fn((_: any, name: string, value: string) => { testState.responseHeaders.set(name, value) }),
}))

import { createSession, destroySession, getSessionUser } from './auth-session'

const event = {} as any
const DAY = 24 * 60 * 60 * 1000
const sessionRow = (expiresInDays: number) => ({
  sessionId: 'session_1',
  userId: 'user_1',
  expiresAt: new Date(Date.now() + expiresInDays * DAY),
  name: 'Test',
  email: 'test@example.test',
  isAdmin: false,
})

const fromApp = () => testState.headers.set('origin', 'capacitor://localhost')
const useDb = (results: any[][] = []) => {
  const db = createQueuedDb(results)
  vi.stubGlobal('db', db)
  return db
}

beforeEach(() => {
  testState.headers.clear()
  testState.cookies.clear()
  testState.responseHeaders.clear()
  testState.setCookie.mockClear()
  testState.deleteCookie.mockClear()
  vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({ appOrigin: 'capacitor://localhost', public: {} }))
})

describe('createSession', () => {
  it('sets the session cookie for the website and no token header', async () => {
    useDb()
    const token = await createSession(event, 'user_1')

    expect(testState.setCookie).toHaveBeenCalledWith(event, 'rav_session', token, expect.objectContaining({ httpOnly: true, sameSite: 'lax' }))
    expect(testState.responseHeaders.has('x-session-token')).toBe(false)
  })

  it('hands the token to the app in a response header and sets no cookie', async () => {
    useDb()
    fromApp()
    const token = await createSession(event, 'user_1')

    expect(testState.responseHeaders.get('x-session-token')).toBe(token)
    expect(testState.setCookie).not.toHaveBeenCalled()
  })
})

describe('getSessionUser', () => {
  it('reads the cookie for the website', async () => {
    useDb([[sessionRow(10)]])
    testState.cookies.set('rav_session', 'web-token')

    await expect(getSessionUser(event)).resolves.toMatchObject({ userId: 'user_1' })
  })

  it('reads the bearer token for the app', async () => {
    useDb([[sessionRow(29.9)]])
    fromApp()
    testState.headers.set('authorization', 'Bearer app-token')

    await expect(getSessionUser(event)).resolves.toMatchObject({ userId: 'user_1' })
  })

  it('ignores a bearer token that does not come from the app origin', async () => {
    const db = useDb([[sessionRow(10)]])
    testState.headers.set('origin', 'https://attacker.test')
    testState.headers.set('authorization', 'Bearer leaked-token')

    await expect(getSessionUser(event)).resolves.toBeNull()
    expect(db.select).not.toHaveBeenCalled()
  })

  it('ignores a website cookie on an app request without a token', async () => {
    const db = useDb([[sessionRow(10)]])
    fromApp()
    testState.cookies.set('rav_session', 'web-token')

    await expect(getSessionUser(event)).resolves.toBeNull()
    expect(db.select).not.toHaveBeenCalled()
  })

  it('returns null when the token matches no live session', async () => {
    useDb([[]])
    fromApp()
    testState.headers.set('authorization', 'Bearer expired-token')

    await expect(getSessionUser(event)).resolves.toBeNull()
  })

  it('pushes an app session forward once it is more than a day old', async () => {
    const db = useDb([[sessionRow(20)]])
    fromApp()
    testState.headers.set('authorization', 'Bearer app-token')

    await getSessionUser(event)

    expect(db.updater.set).toHaveBeenCalledWith({ expiresAt: expect.any(Date) })
    const renewedTo = db.updater.set.mock.calls[0][0].expiresAt.getTime()
    expect(renewedTo).toBeGreaterThan(Date.now() + 29 * DAY)
  })

  it('does not write on every request of a fresh app session', async () => {
    const db = useDb([[sessionRow(29.9)]])
    fromApp()
    testState.headers.set('authorization', 'Bearer app-token')

    await getSessionUser(event)

    expect(db.update).not.toHaveBeenCalled()
  })

  it('never renews a website session', async () => {
    const db = useDb([[sessionRow(2)]])
    testState.cookies.set('rav_session', 'web-token')

    await getSessionUser(event)

    expect(db.update).not.toHaveBeenCalled()
  })
})

describe('destroySession', () => {
  it('deletes the session and clears the cookie for the website', async () => {
    const db = useDb()
    testState.cookies.set('rav_session', 'web-token')

    await destroySession(event)

    expect(db.delete).toHaveBeenCalled()
    expect(testState.deleteCookie).toHaveBeenCalledWith(event, 'rav_session', { path: '/' })
  })

  it('deletes the session by bearer token for the app and touches no cookie', async () => {
    const db = useDb()
    fromApp()
    testState.headers.set('authorization', 'Bearer app-token')

    await destroySession(event)

    expect(db.delete).toHaveBeenCalled()
    expect(testState.deleteCookie).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run them and see the app cases fail**

Run: `yarn vitest run server/utils/auth-session.test.ts`
Expected: FAIL — the app cases fail (no token header, bearer not read, no renewal); the website cases pass.

- [ ] **Step 3: Implement**

Replace `server/utils/auth-session.ts` from its first line through the end of `createSession` with:

```ts
import { H3Event, setCookie, getCookie, deleteCookie, setResponseHeader } from 'h3'
import crypto from 'node:crypto'
import { nanoid } from 'nanoid'
import { eq, and, gt } from 'drizzle-orm'
import { sessions, students } from '../database/schema'
import { getBearerToken, isNativeAppRequest, SESSION_TOKEN_HEADER } from './native-app'

const SESSION_COOKIE = 'rav_session'
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds
const SESSION_RENEW_INTERVAL = 24 * 60 * 60 // app sessions slide forward at most once a day

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/** The iOS app carries the token as a bearer header; the website uses the cookie. Never both. */
function readSessionToken(event: H3Event): string | null {
  return isNativeAppRequest(event) ? getBearerToken(event) : getCookie(event, SESSION_COOKIE) ?? null
}

/**
 * Creates a session for the given user. The website gets the session cookie;
 * the iOS app gets the token in a response header and stores it in the Keychain.
 * Returns the raw session token (only needed internally).
 */
export async function createSession(event: H3Event, userId: string): Promise<string> {
  const token = nanoid(48)
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)

  await db.insert(sessions).values({
    id: nanoid(),
    userId,
    tokenHash,
    expiresAt,
  })

  if (isNativeAppRequest(event)) {
    setResponseHeader(event, SESSION_TOKEN_HEADER, token)
  } else {
    setCookie(event, SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    })
  }

  return token
}
```

In `getSessionUser`, replace its doc comment and first two lines

```ts
/**
 * Reads the session cookie, looks up the session in the database,
 * and returns the associated student (user) or null.
 */
export async function getSessionUser(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return null
```

with

```ts
/**
 * Reads the session token (cookie or bearer), looks up the session in the database,
 * and returns the associated student (user) or null.
 */
export async function getSessionUser(event: H3Event) {
  const token = readSessionToken(event)
  if (!token) return null
```

and replace its last three lines

```ts
  if (result.length === 0) return null

  return result[0]
}
```

with

```ts
  if (result.length === 0) return null

  const session = result[0]
  // The app has no login cookie to refresh, so an app session in use stays alive
  const remainingMs = session.expiresAt.getTime() - now.getTime()
  if (isNativeAppRequest(event) && remainingMs < (SESSION_MAX_AGE - SESSION_RENEW_INTERVAL) * 1000) {
    await db.update(sessions)
      .set({ expiresAt: new Date(now.getTime() + SESSION_MAX_AGE * 1000) })
      .where(eq(sessions.id, session.sessionId))
  }

  return session
}
```

Replace `destroySession` with:

```ts
/**
 * Destroys the current session (deletes from DB and, on the website, clears the cookie).
 */
export async function destroySession(event: H3Event): Promise<void> {
  const token = readSessionToken(event)
  if (token) {
    const tokenHash = hashToken(token)
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash))
  }
  if (!isNativeAppRequest(event)) {
    deleteCookie(event, SESSION_COOKIE, { path: '/' })
  }
}
```

- [ ] **Step 4: Run the tests and see them pass**

Run: `yarn vitest run server/utils/auth-session.test.ts`
Expected: 12 passed.

- [ ] **Step 5: Run the whole unit suite**

Run: `yarn test:unit`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add server/utils/auth-session.ts server/utils/auth-session.test.ts
git commit -m "Accept session tokens from the iOS app next to website cookies"
```

---

### Task 4: Skip CSRF for app requests

**Files:**
- Modify: `server/utils/csrf.ts`, `server/utils/csrf.test.ts`

**Interfaces:**
- Consumes: `isNativeAppRequest` from `./native-app` (Task 2).
- Produces: `requireCsrfProtection(event)` returns without checks for app requests.

- [ ] **Step 1: Write the failing tests**

In `server/utils/csrf.test.ts`, add inside the existing `beforeEach`, as its last line:

```ts
  vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({ appOrigin: 'capacitor://localhost', public: {} }))
```

and add these tests at the end of the `describe('CSRF helper', ...)` block:

```ts
  it('skips origin and token checks for requests from the iOS app', () => {
    testState.headers.set('origin', 'capacitor://localhost')

    expect(() => requireCsrfProtection(event)).not.toThrow()
  })

  it('still rejects other cross-origin requests that carry a valid token', () => {
    testState.headers.set('origin', 'https://attacker.test')
    testState.cookies.set('rav_csrf', 'valid-token')
    testState.headers.set('x-csrf-token', 'valid-token')

    expect(() => requireCsrfProtection(event)).toThrow(expect.objectContaining({ statusCode: 403 }))
  })
```

- [ ] **Step 2: Run them and see the first one fail**

Run: `yarn vitest run server/utils/csrf.test.ts`
Expected: FAIL — "skips origin and token checks for requests from the iOS app" throws a 403.

- [ ] **Step 3: Implement**

In `server/utils/csrf.ts` add after the existing imports:

```ts
import { isNativeAppRequest } from './native-app'
```

and replace `requireCsrfProtection` with:

```ts
export function requireCsrfProtection(event: H3Event): void {
  if (isCsrfSafeMethod(getMethod(event))) return
  // The iOS app authenticates with a bearer token, never with cookies, so there is nothing to forge
  if (isNativeAppRequest(event)) return

  assertSameOrigin(event)
  assertValidCsrfToken(event)
}
```

- [ ] **Step 4: Run the tests and see them pass**

Run: `yarn vitest run server/utils/csrf.test.ts`
Expected: 12 passed.

- [ ] **Step 5: Commit**

```bash
git add server/utils/csrf.ts server/utils/csrf.test.ts
git commit -m "Skip CSRF checks for token-authenticated iOS app requests"
```

---

### Task 5: CORS for the app origin

**Files:**
- Create: `server/middleware/app-cors.ts`, `server/middleware/app-cors.test.ts`

**Interfaces:**
- Consumes: `isNativeAppRequest`, `SESSION_TOKEN_HEADER` from `../utils/native-app` (Task 2).
- Produces: for `/api/**` requests from the app origin, the response headers `Access-Control-Allow-Origin` (the app origin), `Access-Control-Allow-Methods: GET, POST, OPTIONS`, `Access-Control-Allow-Headers: authorization, content-type`, `Access-Control-Expose-Headers: x-session-token`, `Access-Control-Max-Age: 600`, `Vary: Origin`; `OPTIONS` answered with 204.

The file is named `app-cors.ts` so it sorts before `csrf.ts`. Nitro applies the static `Access-Control-Allow-Origin: same-origin` route rule before middleware runs, so this middleware overrides it for the app origin only.

- [ ] **Step 1: Write the failing tests**

Create `server/middleware/app-cors.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const testState = vi.hoisted(() => ({
  headers: new Map<string, string>(),
  method: 'GET',
  pathname: '/api/lessons',
  responseHeaders: {} as Record<string, string>,
  sendNoContent: vi.fn(() => 'no-content'),
}))

vi.mock('h3', () => ({
  createError: (opts: any) => Object.assign(new Error(opts.statusMessage), opts),
  getHeader: vi.fn((_: any, name: string) => testState.headers.get(name.toLowerCase())),
  getMethod: vi.fn(() => testState.method),
  getRequestURL: vi.fn(() => new URL(`https://www.ravennah.com${testState.pathname}`)),
  setResponseHeaders: vi.fn((_: any, headers: Record<string, string>) => { Object.assign(testState.responseHeaders, headers) }),
  sendNoContent: testState.sendNoContent,
}))

import handler from './app-cors'

const event = {} as any
const handle = handler as unknown as (event: any) => unknown

beforeEach(() => {
  testState.headers.clear()
  testState.method = 'GET'
  testState.pathname = '/api/lessons'
  testState.responseHeaders = {}
  testState.sendNoContent.mockClear()
  vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({ appOrigin: 'capacitor://localhost', public: {} }))
})

describe('app CORS middleware', () => {
  it('grants the app origin and exposes the session token header', () => {
    testState.headers.set('origin', 'capacitor://localhost')

    expect(handle(event)).toBeUndefined()
    expect(testState.responseHeaders).toMatchObject({
      'Access-Control-Allow-Origin': 'capacitor://localhost',
      'Access-Control-Allow-Headers': 'authorization, content-type',
      'Access-Control-Expose-Headers': 'x-session-token',
      Vary: 'Origin',
    })
  })

  it('answers the app preflight with 204', () => {
    testState.headers.set('origin', 'capacitor://localhost')
    testState.method = 'OPTIONS'

    expect(handle(event)).toBe('no-content')
    expect(testState.sendNoContent).toHaveBeenCalledWith(event, 204)
    expect(testState.responseHeaders['Access-Control-Allow-Methods']).toBe('GET, POST, OPTIONS')
  })

  it('grants nothing to a preflight from an unknown origin', () => {
    testState.headers.set('origin', 'https://attacker.test')
    testState.method = 'OPTIONS'

    expect(handle(event)).toBeUndefined()
    expect(testState.responseHeaders).toEqual({})
    expect(testState.sendNoContent).not.toHaveBeenCalled()
  })

  it('leaves website requests alone', () => {
    testState.headers.set('origin', 'https://www.ravennah.com')

    handle(event)

    expect(testState.responseHeaders).toEqual({})
  })

  it('only applies to API routes', () => {
    testState.headers.set('origin', 'capacitor://localhost')
    testState.pathname = '/account'

    handle(event)

    expect(testState.responseHeaders).toEqual({})
  })
})
```

- [ ] **Step 2: Run them and see them fail**

Run: `yarn vitest run server/middleware/app-cors.test.ts`
Expected: FAIL — cannot resolve `./app-cors`.

- [ ] **Step 3: Implement**

Create `server/middleware/app-cors.ts`:

```ts
import { getHeader, getMethod, getRequestURL, sendNoContent, setResponseHeaders } from 'h3'
import { isNativeAppRequest, SESSION_TOKEN_HEADER } from '../utils/native-app'

/**
 * The API is same-origin only (see nitro.routeRules). The iOS app is the one exception:
 * its bundle runs on its own origin and calls the API cross-origin with a bearer token.
 */
export default defineEventHandler((event) => {
  if (!getRequestURL(event).pathname.startsWith('/api/')) return
  if (!isNativeAppRequest(event)) return

  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': getHeader(event, 'origin')!,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Expose-Headers': SESSION_TOKEN_HEADER,
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  })

  if (getMethod(event) === 'OPTIONS') return sendNoContent(event, 204)
})
```

- [ ] **Step 4: Run the tests and see them pass**

Run: `yarn vitest run server/middleware/app-cors.test.ts`
Expected: 5 passed.

- [ ] **Step 5: Run the whole unit suite**

Run: `yarn test:unit`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add server/middleware/app-cors.ts server/middleware/app-cors.test.ts
git commit -m "Answer CORS and preflight for the iOS app origin"
```

---

### Task 6: API plugin and token storage in the client

**Files:**
- Create: `app/utils/apiHooks.ts`, `app/utils/apiHooks.test.ts`, `app/utils/sessionTokenStore.ts`
- Rename: `app/plugins/csrf.client.ts` → `app/plugins/api.client.ts` (then modify)
- Modify: `package.json` (dependencies)

**Interfaces:**
- Consumes: `useNativeApp()` (Task 1); response header `x-session-token` (Task 3).
- Produces: `TokenStore = { get(): Promise<string | null>; set(token: string): Promise<void>; clear(): Promise<void> }`, `createNativeApiHooks(tokenStore: TokenStore, apiBase: string)` returning `{ onRequest, onResponse }` for `$fetch.create`, `sessionTokenStore: TokenStore`.

Background for the implementer: ofetch calls `onRequest` with the original request (`/api/...`) and applies `baseURL` afterwards, so `onResponse` sees the full URL (`https://www.ravennah.com/api/...`). The hooks handle both forms.

- [ ] **Step 1: Install the client dependencies**

```bash
yarn add @capacitor/core capacitor-secure-storage-plugin
```

Then open `node_modules/capacitor-secure-storage-plugin/README.md` and confirm the three calls used in Step 6 exist with these shapes: `SecureStoragePlugin.get({ key })` resolving `{ value }` and rejecting when the key is missing, `SecureStoragePlugin.set({ key, value })`, `SecureStoragePlugin.remove({ key })`. If a shape differs, stop and report before continuing.

- [ ] **Step 2: Write the failing tests**

Create `app/utils/apiHooks.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { createNativeApiHooks, type TokenStore } from './apiHooks'

const API_BASE = 'https://www.ravennah.com'

function fakeStore(initial: string | null): TokenStore & { value: string | null } {
  const store = {
    value: initial,
    async get() { return store.value },
    async set(token: string) { store.value = token },
    async clear() { store.value = null },
  }
  return store
}

const response = (status: number, headers: Record<string, string> = {}) => new Response(null, { status, headers })

describe('createNativeApiHooks', () => {
  let store: ReturnType<typeof fakeStore>
  let hooks: ReturnType<typeof createNativeApiHooks>

  beforeEach(() => {
    store = fakeStore('stored-token')
    hooks = createNativeApiHooks(store, API_BASE)
  })

  it('attaches the stored token to API requests', async () => {
    const context: any = { request: '/api/lessons', options: {} }
    await hooks.onRequest(context)

    expect(new Headers(context.options.headers).get('authorization')).toBe('Bearer stored-token')
  })

  it('sends no Authorization header when there is no token', async () => {
    store.value = null
    const context: any = { request: '/api/auth/login', options: {} }
    await hooks.onRequest(context)

    expect(context.options.headers).toBeUndefined()
  })

  it('never sends the token to anything but the API', async () => {
    const context: any = { request: 'https://calndr.link/d/event/', options: {} }
    await hooks.onRequest(context)

    expect(context.options.headers).toBeUndefined()
  })

  it('stores the token a login response hands over', async () => {
    store.value = null
    await hooks.onResponse({ request: `${API_BASE}/api/auth/login`, response: response(200, { 'x-session-token': 'new-token' }) } as any)

    expect(store.value).toBe('new-token')
  })

  it('clears the token on logout', async () => {
    await hooks.onResponse({ request: `${API_BASE}/api/auth/logout`, response: response(200) } as any)

    expect(store.value).toBeNull()
  })

  it('clears a token the server no longer accepts', async () => {
    await hooks.onResponse({ request: `${API_BASE}/api/auth/me`, response: response(401) } as any)

    expect(store.value).toBeNull()
  })

  it('keeps the token when a 401 is not about the session', async () => {
    await hooks.onResponse({ request: `${API_BASE}/api/auth/login`, response: response(401) } as any)
    await hooks.onResponse({ request: `${API_BASE}/api/auth/update-password`, response: response(401) } as any)

    expect(store.value).toBe('stored-token')
  })

  it('recognises API paths with a query string and without a base URL', async () => {
    await hooks.onResponse({ request: '/api/auth/me?x=1', response: response(401) } as any)

    expect(store.value).toBeNull()
  })
})
```

- [ ] **Step 3: Run them and see them fail**

Run: `yarn vitest run app/utils/apiHooks.test.ts`
Expected: FAIL — cannot resolve `./apiHooks`.

- [ ] **Step 4: Implement the hooks**

Create `app/utils/apiHooks.ts`:

```ts
export type TokenStore = {
  get(): Promise<string | null>
  set(token: string): Promise<void>
  clear(): Promise<void>
}

const SESSION_TOKEN_HEADER = 'x-session-token'

/** The API path of a request (`/api/...`, without query), or null when it is not an API call. */
function apiPath(request: unknown, apiBase: string): string | null {
  const url = typeof request === 'string' ? request : (request as Request)?.url ?? String(request)
  const path = apiBase && url.startsWith(apiBase) ? url.slice(apiBase.length) : url
  return path.startsWith('/api/') ? path.split('?')[0]! : null
}

/**
 * $fetch hooks for the iOS app: the session lives in a token (not a cookie),
 * so every API request carries it and login/logout responses update it.
 */
export function createNativeApiHooks(tokenStore: TokenStore, apiBase: string) {
  return {
    async onRequest({ request, options }: { request: unknown; options: { headers?: any } }) {
      if (!apiPath(request, apiBase)) return

      const token = await tokenStore.get()
      if (!token) return

      const headers = new Headers(options.headers as HeadersInit | undefined)
      headers.set('authorization', `Bearer ${token}`)
      options.headers = headers
    },
    async onResponse({ request, response }: { request: unknown; response: Response }) {
      const path = apiPath(request, apiBase)
      if (!path) return

      const token = response.headers.get(SESSION_TOKEN_HEADER)
      if (token) {
        await tokenStore.set(token)
      } else if (path === '/api/auth/logout' || (path === '/api/auth/me' && response.status === 401)) {
        // Other 401s (a wrong password, for example) say nothing about the stored session
        await tokenStore.clear()
      }
    },
  }
}
```

- [ ] **Step 5: Run the tests and see them pass**

Run: `yarn vitest run app/utils/apiHooks.test.ts`
Expected: 8 passed.

- [ ] **Step 6: Add the Keychain store**

Create `app/utils/sessionTokenStore.ts`:

```ts
import type { TokenStore } from './apiHooks'

const KEY = 'rav_session_token'

let cached: string | null | undefined

// Loaded on demand so the website bundle never ships the native plugin
async function storage() {
  const { SecureStoragePlugin } = await import('capacitor-secure-storage-plugin')
  return SecureStoragePlugin
}

/** The iOS app's session token, kept in the Keychain. */
export const sessionTokenStore: TokenStore = {
  async get() {
    if (cached === undefined) {
      // The plugin rejects when the key does not exist
      cached = await (await storage()).get({ key: KEY }).then((result) => result.value, () => null)
    }
    return cached
  },
  async set(token) {
    cached = token
    await (await storage()).set({ key: KEY, value: token })
  },
  async clear() {
    cached = null
    await (await storage()).remove({ key: KEY }).catch(() => {})
  },
}
```

- [ ] **Step 7: Turn the CSRF plugin into the single API plugin**

Run the unit suite first, because a file is about to move: `yarn test:unit` — expected: all pass.

```bash
git mv app/plugins/csrf.client.ts app/plugins/api.client.ts
```

In `app/plugins/api.client.ts` replace

```ts
export default defineNuxtPlugin(() => {
  let csrfToken: string | null = null
  let csrfTokenPromise: Promise<string> | null = null
  const rawFetch = globalThis.$fetch
```

with

```ts
/**
 * Every API call goes through the global $fetch wrapped here.
 * Website: adds the CSRF token to mutating requests.
 * iOS app: adds the API base and the session token instead (no cookies, so no CSRF).
 */
export default defineNuxtPlugin(() => {
  const rawFetch = globalThis.$fetch
  const { isNativeApp, apiBase } = useNativeApp()

  if (isNativeApp) {
    globalThis.$fetch = rawFetch.create({
      baseURL: apiBase,
      ...createNativeApiHooks(sessionTokenStore, apiBase),
    }) as typeof globalThis.$fetch
    return
  }

  let csrfToken: string | null = null
  let csrfTokenPromise: Promise<string> | null = null
```

The rest of the file (the CSRF token fetch and the existing `rawFetch.create` call) is unchanged. `createNativeApiHooks` and `sessionTokenStore` are auto-imported from `app/utils`.

- [ ] **Step 8: Verify both targets still build**

Run: `yarn test:unit`
Expected: all pass.

Run: `NUXT_PUBLIC_API_BASE=http://localhost:3000 yarn build:ios:bundle`
Expected: build finishes.

Run: `yarn test:e2e:branch e2e/booking.spec.ts`
Expected: 2 passed — the website still logs in with its cookie and CSRF token and books a lesson.

- [ ] **Step 9: Commit**

```bash
git add app/utils app/plugins package.json yarn.lock
git commit -m "Route iOS app API calls through the API plugin with a Keychain token"
```

---

### Task 7: App-mode smoke test and the app's UI differences

**Files:**
- Create: `scripts/serve-ios-bundle.ts`, `e2e/app-mode.spec.ts`, `app/middleware/external.global.ts`
- Modify: `scripts/e2e-branch.ts`, `playwright.config.ts`, `e2e/helpers.ts`, `e2e/booking.spec.ts`, `app/pages/login.vue`, `app/components/AccountDetails.vue`, `app/components/NavYoga.vue`, `app/layouts/default.vue`

**Interfaces:**
- Consumes: `yarn build:ios:bundle` and `EXTERNAL_ROUTE_NAME` (Task 1), `useNativeApp()` (Task 1), the server and client token path (Tasks 2–6).
- Produces: `yarn test:e2e:branch --app` (runs only the app-mode project), helper `bookFirstAvailableLesson(page: Page): Promise<void>`.

The smoke test serves the iOS bundle on `http://localhost:4173` and points the test server's `NUXT_APP_ORIGIN` at that address, so a normal Chromium exercises the same cross-origin token path the iPhone uses.

- [ ] **Step 1: Share the booking steps between specs**

Run `yarn test:unit` (expected: all pass) before touching the existing spec.

Add to the end of `e2e/helpers.ts`:

```ts
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
```

In `e2e/booking.spec.ts`:
- change the helpers import to `import { bookFirstAvailableLesson, login as loginAs, logout, openAccountTab } from './helpers'`;
- replace everything from the comment `// --- Step 3: Open booking modal from the Boekingen tab ---` through the closing `}` of the `try { ... } catch (e) { ... }` block of Step 5 with:

```ts
        // --- Steps 3-5: Book the first available lesson from the Boekingen tab ---
        await bookFirstAvailableLesson(page)
```

Run: `yarn test:e2e:branch e2e/booking.spec.ts`
Expected: 2 passed.

- [ ] **Step 2: Add the static server for the bundle**

Create `scripts/serve-ios-bundle.ts`:

```ts
/**
 * Serves the iOS bundle (.output-ios/public) for the app-mode e2e run.
 * Like the iOS shell, every path without a file extension gets the SPA entry.
 *
 * Usage: tsx scripts/serve-ios-bundle.ts [port]
 */

import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const ROOT = '.output-ios/public'
const port = Number(process.argv[2] ?? 4173)

const CONTENT_TYPES: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
}

createServer(async (req, res) => {
    const pathname = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname))
    const file = extname(pathname) ? join(ROOT, pathname) : join(ROOT, 'index.html')
    try {
        const body = await readFile(file)
        res.writeHead(200, { 'content-type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream' })
        res.end(body)
    } catch {
        res.writeHead(404).end()
    }
}).listen(port, 'localhost', () => console.log(`iOS bundle on http://localhost:${port}`))
```

- [ ] **Step 3: Add the app-mode project to Playwright**

In `playwright.config.ts` replace the `projects` array with:

```ts
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
```

- [ ] **Step 4: Teach the runner `--app`**

In `scripts/e2e-branch.ts`:

1. In the usage comment at the top, after the `--keep` line, add:

```
 *   yarn test:e2e:branch --app              # only the iOS bundle smoke test (e2e/app-mode.spec.ts)
```

2. Replace

```ts
const PORT = 3100
const BASE_URL = `http://localhost:${PORT}`
const READY_TIMEOUT_MS = 180_000

const args = process.argv.slice(2)
const keepBranch = args.includes('--keep')
const playwrightArgs = args.filter((a) => a !== '--keep')
```

with

```ts
const PORT = 3100
const BASE_URL = `http://localhost:${PORT}`
const APP_PORT = 4173
const APP_BASE_URL = `http://localhost:${APP_PORT}`
const READY_TIMEOUT_MS = 180_000

const args = process.argv.slice(2)
const keepBranch = args.includes('--keep')
const appMode = args.includes('--app')
const playwrightArgs = args.filter((a) => a !== '--keep' && a !== '--app')
```

3. Replace `let devServer: ChildProcess | undefined` with:

```ts
let devServer: ChildProcess | undefined
let appServer: ChildProcess | undefined
```

4. In `cleanup`, replace

```ts
    if (devServer?.pid && devServer.exitCode === null) {
        try { process.kill(-devServer.pid, 'SIGTERM') } catch { /* already gone */ }
    }
```

with

```ts
    for (const server of [devServer, appServer]) {
        if (server?.pid && server.exitCode === null) {
            try { process.kill(-server.pid, 'SIGTERM') } catch { /* already gone */ }
        }
    }
```

5. Directly above `async function main()` add:

```ts
/** Builds the iOS bundle against the test server and serves it like the app shell would. */
async function serveIosBundle(): Promise<void> {
    console.log('Building the iOS bundle')
    const buildCode = await run('yarn', ['build:ios:bundle'], { ...process.env, NUXT_PUBLIC_API_BASE: BASE_URL })
    if (buildCode !== 0) throw new Error('iOS bundle build failed')

    appServer = spawn('yarn', ['tsx', 'scripts/serve-ios-bundle.ts', String(APP_PORT)], { stdio: ['ignore', 'ignore', 'inherit'], detached: true })
    const deadline = Date.now() + 30_000
    while (Date.now() < deadline) {
        if (await fetch(APP_BASE_URL).then((r) => r.ok, () => false)) return
        await new Promise((resolve) => setTimeout(resolve, 500))
    }
    throw new Error('iOS bundle server not ready after 30s')
}
```

6. In `main`, replace

```ts
    const appEnv = { ...process.env, NUXT_DATABASE_URL: created.connectionUri, NODE_ENV: 'development' }
```

with

```ts
    // NUXT_APP_ORIGIN: the test server treats the served iOS bundle as "the app"
    const appEnv = { ...process.env, NUXT_DATABASE_URL: created.connectionUri, NUXT_APP_ORIGIN: APP_BASE_URL, NODE_ENV: 'development' }
```

and replace

```ts
    return run('yarn', ['playwright', 'test', ...playwrightArgs], {
        ...process.env,
        BASE_URL,
        TEST_EMAIL: E2E_STUDENT.email,
        TEST_PASSWORD: E2E_PASSWORD,
    })
```

with

```ts
    if (appMode) await serveIosBundle()

    return run('yarn', ['playwright', 'test', '--project', appMode ? 'app' : 'chromium', ...playwrightArgs], {
        ...process.env,
        BASE_URL,
        ...(appMode ? { APP_BASE_URL } : {}),
        TEST_EMAIL: E2E_STUDENT.email,
        TEST_PASSWORD: E2E_PASSWORD,
    })
```

- [ ] **Step 5: Write the failing smoke test**

Create `e2e/app-mode.spec.ts`:

```ts
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
```

- [ ] **Step 6: Run it and see it fail on the UI**

Run: `yarn test:e2e:branch --app`
Expected: FAIL at `expect(page.locator('#password')).toBeVisible` — the login page still opens in passkey mode. (Reaching the login page at all proves the bundle, the root redirect and the cross-origin `/api/auth/me` call work.)

- [ ] **Step 7: Make the login page password-first in the app**

In `app/pages/login.vue`:

1. Replace

```ts
const loginMode = ref<'password' | 'otp' | 'passkey' | 'forgot'>('passkey')
```

with

```ts
// Passkeys are bound to the website's hostname, so the iOS app starts with the password form
const { isNativeApp } = useNativeApp()
const defaultLoginMode = isNativeApp ? 'password' : 'passkey'
const backLabel = isNativeApp ? 'Terug naar wachtwoord' : 'Terug naar passkey'
const loginMode = ref<'password' | 'otp' | 'passkey' | 'forgot'>(defaultLoginMode)
```

2. Replace

```ts
function backToPasskey() {
  switchLoginMode('passkey')
}
```

with

```ts
function backToDefaultLogin() {
  switchLoginMode(defaultLoginMode)
}
```

3. In the `<template>`, inside the `<!-- Password login -->` block, replace

```html
              <div class="text-center">
                <button type="button" class="text-sm text-gray-400 hover:text-emerald-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-2 py-0.5"
                  @click="backToPasskey">
                  Terug naar passkey
                </button>
              </div>
            </template>

            <!-- Register -->
```

with

```html
              <div class="text-center">
                <button type="button" class="text-sm text-gray-400 hover:text-emerald-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-2 py-0.5"
                  @click="isNativeApp ? switchLoginMode('otp') : backToDefaultLogin()">
                  {{ isNativeApp ? 'Inloggen met e-mailcode' : 'Terug naar passkey' }}
                </button>
              </div>
            </template>

            <!-- Register -->
```

4. In the rest of the file replace every remaining `backToPasskey` with `backToDefaultLogin`, and every remaining literal `Terug naar passkey` in the template with `{{ backLabel }}`.

Check: `grep -c "backToPasskey" app/pages/login.vue` prints `0`, and `grep -c "Terug naar passkey" app/pages/login.vue` prints `2` (the `backLabel` constant and the password block).

- [ ] **Step 8: Hide passkey settings in the app**

In `app/components/AccountDetails.vue` replace

```ts
const showPasskeySettings = computed(() => !props.user && targetUser.value?.$id === loggedInUser.value?.$id)
```

with

```ts
const { isNativeApp } = useNativeApp()
const showPasskeySettings = computed(() => !isNativeApp && !props.user && targetUser.value?.$id === loggedInUser.value?.$id)
```

- [ ] **Step 9: Show only member links in the app's navigation**

In `app/components/NavYoga.vue`:

1. In `<script setup>`, after `const navOpen = ref(false);` add:

```ts
const { isNativeApp } = useNativeApp()
```

2. In the mobile list (`<ul class="w-full space-y-8">`, items with class `mobile-nav-item`):
   - insert `<template v-if="!isNativeApp">` directly before the `<li>` of `Home`, and `</template>` directly after the closing `</li>` of `Voordelen` (wrapping Home, Over mij, Voordelen);
   - insert `<template v-if="!isNativeApp">` directly before the `<li>` of `Priveles`, and `</template>` directly after the closing `</li>` of `Contact` (wrapping Priveles, Hatha Yoga, Tarieven, Contact).
3. In the desktop list (`<nav class="hidden md:block ...">`, items with class `nav-item`):
   - insert `<template v-if="!isNativeApp">` directly before the `<li>` of `Home`, and `</template>` directly after the closing `</li>` of `Over mij`;
   - insert `<template v-if="!isNativeApp">` directly before the `<li>` of `Priveles`, and `</template>` directly after the closing `</li>` of `Contact` (wrapping Priveles, Hatha Yoga, Tarieven, Voordelen, Contact).

`Les schema`, the account/login item, `Logout` and the logo stay visible. The logo links to `/`, which the app redirects to `/account`.

4. The default layout (used by `/login` and `/lessen`) ends with the website footer, which is all marketing links. Replace the whole of `app/layouts/default.vue` with:

```vue
<script setup lang="ts">
const { isNativeApp } = useNativeApp()
</script>

<template>
  <div class="yoga">
    <NavYoga />
    <slot />
    <FooterYoga v-if="!isNativeApp" />
  </div>
</template>
```

- [ ] **Step 10: Open non-member links on the website**

Create `app/middleware/external.global.ts`:

```ts
import { EXTERNAL_ROUTE_NAME } from '~~/config/ios-target'

/**
 * The iOS app only contains the member pages. Any other link matches the app's
 * catch-all route and opens the website instead (the route does not exist on the web).
 */
export default defineNuxtRouteMiddleware((to, from) => {
  if (to.name !== EXTERNAL_ROUTE_NAME) return

  const { apiBase } = useNativeApp()
  window.open(`${apiBase}${to.fullPath}`, '_blank')
  return from.matched.length > 0 ? abortNavigation() : navigateTo('/account')
})
```

- [ ] **Step 11: Run the smoke test and see it pass**

Run: `yarn test:e2e:branch --app`
Expected: 1 passed.

- [ ] **Step 12: Confirm the website is unaffected**

Run: `yarn test:unit`
Expected: all pass.

Run: `yarn test:e2e:branch`
Expected: all website specs pass (booking and registration); the app-mode spec is not part of this run.

- [ ] **Step 13: Commit**

```bash
git add scripts/serve-ios-bundle.ts scripts/e2e-branch.ts playwright.config.ts e2e app/middleware/external.global.ts app/pages/login.vue app/components/AccountDetails.vue app/components/NavYoga.vue app/layouts/default.vue
git commit -m "Smoke-test the iOS bundle and adapt login and navigation for the app"
```

---

### Task 8: The Capacitor iOS project

**Files:**
- Create: `capacitor.config.ts`, `ios/` (generated)
- Modify: `package.json`, `ios/App/App/Info.plist`, `CLAUDE.md`

**Interfaces:**
- Consumes: `yarn build:ios:bundle` (Task 1), `.output-ios/public`.
- Produces: `yarn build:ios` (bundle for production + sync), `yarn dev:ios` (bundle against the local dev server + run in the simulator).

- [ ] **Step 1: Raise the Node floor**

The Capacitor 8 CLI requires Node 22 or newer, and Yarn 1 refuses to install a dependency whose `engines` do not match.

In `package.json` change `"node": ">=20"` to `"node": ">=22"`.
In `CLAUDE.md` change `No linter is configured. Node 20 is required.` to `No linter is configured. Node 22 or newer is required (Capacitor CLI).`

Run: `node -v`
Expected: v22 or newer.

Stop here and ask the owner to confirm that the DigitalOcean App Platform build already runs Node 22 or newer (the build log prints the Node version). Do not merge this branch before that is confirmed.

- [ ] **Step 2: Install Capacitor**

```bash
yarn add @capacitor/ios
yarn add -D @capacitor/cli
```

Expected: both install without an engine error.

- [ ] **Step 3: Configure Capacitor**

Create `capacitor.config.ts`:

```ts
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.ravennah.app',
  appName: 'Yoga Ravennah',
  // The client-only member bundle from `yarn build:ios:bundle`
  webDir: '.output-ios/public',
}

export default config
```

- [ ] **Step 4: Add the scripts**

In `package.json` `scripts`, after `"build:ios:bundle"` add:

```json
    "build:ios": "NUXT_PUBLIC_API_BASE=https://www.ravennah.com yarn build:ios:bundle && cap sync ios",
    "dev:ios": "NUXT_PUBLIC_API_BASE=http://localhost:3000 yarn build:ios:bundle && cap sync ios && cap run ios",
```

- [ ] **Step 5: Generate the iOS project**

```bash
NUXT_PUBLIC_API_BASE=http://localhost:3000 yarn build:ios:bundle
npx cap add ios --packagemanager SPM
npx cap sync ios
```

Expected: `ios/App/App.xcodeproj` exists, there is no `ios/App/Podfile`, and the sync output lists `capacitor-secure-storage-plugin` among the found Capacitor plugins.

If the sync reports that the plugin does not support Swift Package Manager, stop and report: the choice between CocoaPods and another Keychain plugin is the owner's.

- [ ] **Step 6: Allow the simulator to reach the local dev server**

In `ios/App/App/Info.plist`, directly before the final `</dict>` add:

```xml
	<key>NSAppTransportSecurity</key>
	<dict>
		<key>NSAllowsLocalNetworking</key>
		<true/>
	</dict>
```

- [ ] **Step 7: Verify the native project compiles**

Run:

```bash
xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator -configuration Debug CODE_SIGNING_ALLOWED=NO build | tail -3
```

Expected: `** BUILD SUCCEEDED **`

- [ ] **Step 8: Document the new commands**

In `CLAUDE.md`, in the `## Build & Dev Commands` code block, after the `yarn preview` line add:

```
yarn build:ios  # iOS app: client-only member bundle against https://www.ravennah.com, synced into ios/
yarn dev:ios    # iOS app in the simulator against a running `yarn dev` (Neon dev branch); no live reload
```

and after the paragraph that starts with `` `yarn dev`, `yarn preview`, `` add this paragraph:

```
The iOS app (Capacitor, `ios/`) bundles only the member pages (`config/ios-target.ts`) and calls the API cross-origin. The server recognises it by its `Origin` (`isNativeAppRequest` in `server/utils/native-app.ts`): those requests use a bearer session token instead of the cookie, skip CSRF, and get CORS. In components, ask `useNativeApp()` — never check the platform directly. `yarn test:e2e:branch --app` smoke-tests the bundle in a browser.
```

- [ ] **Step 9: Run in the simulator (owner, manual)**

Terminal 1: `yarn dev`. Terminal 2: `yarn dev:ios`, then pick an iPhone simulator.

Checklist:
- [ ] The app opens on the login page with the password form; no passkey option, no marketing links in the menu.
- [ ] Logging in with a dev-branch account (password `welkom` for anonymised students) lands on `/account`.
- [ ] Quitting the app from the app switcher and reopening it keeps the user signed in.
- [ ] Booking a lesson and cancelling a booking both work.
- [ ] Tapping a lesson title on `/lessen` opens the website in Safari, and returning to the app shows `/lessen`.
- [ ] Logout returns to the login page; reopening the app stays on the login page.

If API calls fail in the simulator while the browser smoke test passes, open Safari → Develop → Simulator → the app's web inspector and report the console error; do not work around it.

If a lesson-title tap does not open Safari, report it: the fix (opening external links through a Capacitor plugin instead of `window.open`) is part of milestone 3's "links leaving the member area" work and can be pulled forward.

- [ ] **Step 10: Commit**

```bash
git add capacitor.config.ts ios package.json yarn.lock CLAUDE.md
git commit -m "Add the Capacitor iOS project for Yoga Ravennah"
```

---

## Self-review notes

- Spec section 1 (structure and build): Tasks 1 and 8. Section 2 (login and API client): Tasks 2–6, passkeys hidden in Task 7. Section 6 for this milestone (unit tests, app-mode smoke spec, manual checklist): Tasks 2–8.
- Spec "to verify" items settled here: sessions did not renew on use, so Task 3 adds renewal for app sessions; Capacitor 8 is used with Swift Package Manager (Task 8, with a stop if the Keychain plugin lacks SPM support); the Keychain plugin is `capacitor-secure-storage-plugin`.
- Not in this milestone: push, calendar, haptics, share, universal links, badge, account deletion, `/privacy`, app icon and splash, TestFlight.
