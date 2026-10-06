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
