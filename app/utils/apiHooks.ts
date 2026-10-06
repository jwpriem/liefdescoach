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
    async onRequest({ request, options }: { request: unknown; options: { headers?: any; baseURL?: string } }) {
      if (!apiPath(request, apiBase)) return

      // Only API calls go to the website; Nuxt's own fetches (/_nuxt/...) stay local
      options.baseURL = apiBase

      const token = await tokenStore.get()
      if (!token) return

      const headers = new Headers(options.headers as HeadersInit | undefined)
      headers.set('authorization', `Bearer ${token}`)
      options.headers = headers
    },
    async onRequestError({ request }: { request: unknown }) {
      // A logout that cannot reach the server still signs the app out on this device
      if (apiPath(request, apiBase) === '/api/auth/logout') await tokenStore.clear()
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
