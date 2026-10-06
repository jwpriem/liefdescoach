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
