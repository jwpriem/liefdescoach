import type { TokenStore } from './apiHooks'

const KEY = 'rav_session_token'

let cached: string | null | undefined

// Loaded on demand so the website bundle never ships the native plugin.
// The plugin is handed to a callback instead of being returned: resolving a promise with
// a Capacitor plugin proxy makes JS call its `then`, which the plugin rejects.
async function withStorage<T>(use: (plugin: typeof import('capacitor-secure-storage-plugin').SecureStoragePlugin) => Promise<T>): Promise<T> {
  const { SecureStoragePlugin } = await import('capacitor-secure-storage-plugin')
  return use(SecureStoragePlugin)
}

/** The iOS app's session token, kept in the Keychain. */
export const sessionTokenStore: TokenStore = {
  async get() {
    if (cached === undefined) {
      // Ask which keys exist first: a failing read then means "Keychain unavailable",
      // which must surface as an error and not be remembered as "no token"
      cached = await withStorage(async (storage) => {
        const { value: keys } = await storage.keys()
        return keys.includes(KEY) ? (await storage.get({ key: KEY })).value : null
      })
    }
    return cached
  },
  async set(token) {
    await withStorage((storage) => storage.set({ key: KEY, value: token }))
    cached = token
  },
  async clear() {
    cached = null
    await withStorage((storage) => storage.remove({ key: KEY })).catch(() => {})
  },
}
