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

  it('sets the API base on API requests, even without a token', async () => {
    store.value = null
    const context: any = { request: '/api/auth/login', options: {} }
    await hooks.onRequest(context)

    expect(context.options.baseURL).toBe(API_BASE)
  })

  it('leaves non-API requests alone', async () => {
    const context: any = { request: '/_nuxt/builds/latest.json', options: {} }
    await hooks.onRequest(context)

    expect(context.options.baseURL).toBeUndefined()
    expect(context.options.headers).toBeUndefined()
  })

  it('clears the token when the logout request cannot reach the server', async () => {
    await hooks.onRequestError({ request: '/api/auth/logout', options: {} } as any)

    expect(store.value).toBeNull()
  })

  it('keeps the token when another request fails to reach the server', async () => {
    await hooks.onRequestError({ request: '/api/lessons', options: {} } as any)

    expect(store.value).toBe('stored-token')
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
    const options = { headers: new Headers({ authorization: 'Bearer stored-token' }) }
    await hooks.onResponse({ request: `${API_BASE}/api/auth/me`, options, response: response(401) } as any)

    expect(store.value).toBeNull()
  })

  it('keeps the token when the 401 was for a request that sent none', async () => {
    await hooks.onResponse({ request: `${API_BASE}/api/auth/me`, options: {}, response: response(401) } as any)

    expect(store.value).toBe('stored-token')
  })

  it('keeps the token when a 401 is not about the session', async () => {
    await hooks.onResponse({ request: `${API_BASE}/api/auth/login`, response: response(401) } as any)
    await hooks.onResponse({ request: `${API_BASE}/api/auth/update-password`, response: response(401) } as any)

    expect(store.value).toBe('stored-token')
  })

  it('clears the token after the account was deleted', async () => {
    await hooks.onResponse({ request: `${API_BASE}/api/auth/delete-account`, response: response(200) } as any)

    expect(store.value).toBeNull()
  })

  it('keeps the token when deleting the account was refused', async () => {
    await hooks.onResponse({ request: `${API_BASE}/api/auth/delete-account`, response: response(400) } as any)

    expect(store.value).toBe('stored-token')
  })

  it('recognises API paths with a query string and without a base URL', async () => {
    const options = { headers: new Headers({ authorization: 'Bearer stored-token' }) }
    await hooks.onResponse({ request: '/api/auth/me?x=1', options, response: response(401) } as any)

    expect(store.value).toBeNull()
  })
})
