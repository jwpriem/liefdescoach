import type { TokenStore } from './apiHooks'

const KEY = 'rav_session_token'

let cached: string | null = null

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
    if (cached) return cached
    // The native plugin answers an unavailable Keychain with an empty key list, so "nothing there"
    // is not remembered: it is read again next time. Only a token that was actually read is cached.
    const token = await withStorage(async (storage) => {
      const { value: keys } = await storage.keys()
      return keys.includes(KEY) ? (await storage.get({ key: KEY })).value : null
    })
    if (token) cached = token
    return token
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
