import { beforeEach, describe, expect, it, vi } from 'vitest'

const plugin = vi.hoisted(() => ({
  listeners: new Map<string, (event: any) => void>(),
  addListener: vi.fn(),
}))

vi.mock('@capacitor/app', () => ({
  App: new Proxy(plugin, {
    get(target, key) {
      if (key === 'then') throw new Error('App.then() is not implemented')
      return (target as any)[key]
    },
  }),
}))

import { appPathFromLink, onAppLink } from './nativeLinks'

const SITE = 'https://www.ravennah.com'

beforeEach(() => {
  plugin.listeners.clear()
  plugin.addListener.mockReset().mockImplementation(async (name: string, handler: (event: any) => void) => {
    plugin.listeners.set(name, handler)
    return { remove: async () => {} }
  })
})

describe('appPathFromLink', () => {
  it('keeps the path and the query of a member link', () => {
    expect(appPathFromLink(`${SITE}/reset-wachtwoord?token=abc`, SITE)).toBe('/reset-wachtwoord?token=abc')
    expect(appPathFromLink(`${SITE}/account?tab=lessen`, SITE)).toBe('/account?tab=lessen')
    expect(appPathFromLink(`${SITE}/admin/users/student_1`, SITE)).toBe('/admin/users/student_1')
  })

  it('ignores links to pages the app does not contain', () => {
    expect(appPathFromLink(`${SITE}/tarieven`, SITE)).toBeNull()
    expect(appPathFromLink(`${SITE}/`, SITE)).toBeNull()
    expect(appPathFromLink(`${SITE}/lessen-info`, SITE)).toBeNull()
  })

  it('ignores other sites, other schemes and nonsense', () => {
    expect(appPathFromLink('https://evil.example/account', SITE)).toBeNull()
    expect(appPathFromLink('https://www.ravennah.com.evil.example/account', SITE)).toBeNull()
    expect(appPathFromLink('capacitor://localhost/account', SITE)).toBeNull()
    expect(appPathFromLink('not a url', SITE)).toBeNull()
    expect(appPathFromLink('', SITE)).toBeNull()
  })
})

describe('onAppLink', () => {
  it('hands the opened url to the handler', async () => {
    const handler = vi.fn()
    await onAppLink(handler)

    plugin.listeners.get('appUrlOpen')?.({ url: `${SITE}/lessen` })
    expect(handler).toHaveBeenCalledWith(`${SITE}/lessen`)
  })

  it('does not throw where the app plugin does not exist', async () => {
    plugin.addListener.mockRejectedValue(new Error('Not implemented on web.'))
    await expect(onAppLink(vi.fn())).resolves.toBeUndefined()
  })
})
