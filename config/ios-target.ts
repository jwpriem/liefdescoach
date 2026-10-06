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
