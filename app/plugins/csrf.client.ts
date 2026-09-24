const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function isMutatingApiRequest(request: any, options: any): boolean {
  const method = String(options?.method ?? 'GET').toUpperCase()
  const url = typeof request === 'string' ? request : request?.toString?.() ?? ''

  return MUTATING_METHODS.has(method) && url.startsWith('/api/')
}

export default defineNuxtPlugin(() => {
  let csrfToken: string | null = null
  let csrfTokenPromise: Promise<string> | null = null
  const rawFetch = globalThis.$fetch

  async function getCsrfToken(): Promise<string> {
    if (csrfToken) return csrfToken
    if (!csrfTokenPromise) {
      csrfTokenPromise = rawFetch<{ token: string }>('/api/csrf-token')
        .then((response) => {
          csrfToken = response.token
          return response.token
        })
        .finally(() => {
          csrfTokenPromise = null
        })
    }

    return csrfTokenPromise
  }

  globalThis.$fetch = rawFetch.create({
    async onRequest({ request, options }) {
      if (!isMutatingApiRequest(request, options)) return

      const token = await getCsrfToken()
      const headers = new Headers(options.headers as HeadersInit | undefined)
      headers.set('x-csrf-token', token)
      options.headers = headers
    },
    async onResponseError({ response }) {
      if (response.status === 403) {
        csrfToken = null
      }
    },
  }) as typeof globalThis.$fetch
})
