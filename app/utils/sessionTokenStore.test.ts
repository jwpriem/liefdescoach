import { beforeEach, describe, expect, it, vi } from 'vitest'

const keychain = vi.hoisted(() => ({
  items: new Map<string, string>(),
  failing: false,
}))

vi.mock('capacitor-secure-storage-plugin', () => {
  const guard = () => { if (keychain.failing) throw new Error('Keychain is locked') }
  const plugin = {
    // Like the native plugin: an unavailable Keychain gives an empty list, not an error
    async keys() { return { value: keychain.failing ? [] : [...keychain.items.keys()] } },
    async get({ key }: { key: string }) {
      guard()
      if (!keychain.items.has(key)) throw new Error('Item with given key does not exist')
      return { value: keychain.items.get(key)! }
    },
    async set({ key, value }: { key: string; value: string }) { guard(); keychain.items.set(key, value); return { value: true } },
    async remove({ key }: { key: string }) { guard(); keychain.items.delete(key); return { value: true } },
  }
  return {
    // Like the real plugin: a Proxy that refuses to be treated as a promise
    SecureStoragePlugin: new Proxy(plugin, {
      get(target, key) {
        if (key === 'then') throw new Error('SecureStoragePlugin.then() is not implemented')
        return (target as any)[key]
      },
    }),
  }
})

async function load() {
  vi.resetModules()
  return (await import('./sessionTokenStore')).sessionTokenStore
}

beforeEach(() => {
  keychain.items.clear()
  keychain.failing = false
})

describe('sessionTokenStore', () => {
  it('answers null when no token was ever stored', async () => {
    const store = await load()
    await expect(store.get()).resolves.toBeNull()
  })

  it('returns a stored token, also after a restart', async () => {
    await (await load()).set('token-1')

    const afterRestart = await load()
    await expect(afterRestart.get()).resolves.toBe('token-1')
  })

  it('does not remember "nothing there" while the Keychain is unavailable', async () => {
    keychain.items.set('rav_session_token', 'token-1')
    const store = await load()

    keychain.failing = true
    await expect(store.get()).resolves.toBeNull()

    keychain.failing = false
    await expect(store.get()).resolves.toBe('token-1')
  })

  it('does not remember a token the Keychain refused', async () => {
    const store = await load()

    keychain.failing = true
    await expect(store.set('token-2')).rejects.toThrow('Keychain is locked')

    keychain.failing = false
    await expect(store.get()).resolves.toBeNull()
  })

  it('forgets the token on clear', async () => {
    const store = await load()
    await store.set('token-1')
    await store.clear()

    await expect(store.get()).resolves.toBeNull()
    await expect((await load()).get()).resolves.toBeNull()
  })
})
