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
      // The plugin rejects when the key does not exist
      cached = await withStorage((storage) => storage.get({ key: KEY }).then((result) => result.value, () => null))
    }
    return cached
  },
  async set(token) {
    cached = token
    await withStorage((storage) => storage.set({ key: KEY, value: token }))
  },
  async clear() {
    cached = null
    await withStorage((storage) => storage.remove({ key: KEY })).catch(() => {})
  },
}
