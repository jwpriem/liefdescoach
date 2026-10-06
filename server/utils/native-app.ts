import { getHeader, getRequestURL, type H3Event } from 'h3'

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

/**
 * Origin to use in links we email. The website's own Origin for website requests;
 * for the iOS app (whose Origin is not a web address) the address this server was reached at.
 */
export function getSiteOrigin(event: H3Event): string {
  return isNativeAppRequest(event) ? getRequestURL(event).origin : getHeader(event, 'origin')!
}
