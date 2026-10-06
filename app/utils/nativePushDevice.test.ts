import { beforeEach, describe, expect, it, vi } from 'vitest'

const TOKEN = 'a1b2c3d4'.repeat(8)

const plugin = vi.hoisted(() => {
  const listeners = new Map<string, (arg: any) => void>()
  return {
    listeners,
    permission: 'prompt' as string,
    registrationFails: false,
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    register: vi.fn(),
    unregister: vi.fn(),
    addListener: vi.fn(),
  }
})

vi.mock('@capacitor/push-notifications', () => ({
  // Like the real plugin: a Proxy that refuses to be treated as a promise
  PushNotifications: new Proxy(plugin, {
    get(target, key) {
      if (key === 'then') throw new Error('PushNotifications.then() is not implemented')
      return (target as any)[key]
    },
  }),
}))

const storage = new Map<string, string>()
const fetchMock = vi.fn()

async function load() {
  vi.resetModules()
  return import('./nativePushDevice')
}

beforeEach(() => {
  storage.clear()
  plugin.listeners.clear()
  plugin.permission = 'prompt'
  plugin.registrationFails = false
  fetchMock.mockReset().mockResolvedValue({ success: true })
  vi.stubGlobal('$fetch', fetchMock)
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value) },
    removeItem: (key: string) => { storage.delete(key) },
  })

  plugin.checkPermissions.mockReset().mockImplementation(async () => ({ receive: plugin.permission }))
  plugin.requestPermissions.mockReset().mockImplementation(async () => {
    if (plugin.permission === 'prompt') plugin.permission = 'granted'
    return { receive: plugin.permission }
  })
  plugin.addListener.mockReset().mockImplementation(async (name: string, handler: (arg: any) => void) => {
    plugin.listeners.set(name, handler)
    return { remove: async () => { plugin.listeners.delete(name) } }
  })
  plugin.register.mockReset().mockImplementation(async () => {
    queueMicrotask(() => {
      if (plugin.registrationFails) plugin.listeners.get('registrationError')?.({ error: 'no network' })
      else plugin.listeners.get('registration')?.({ value: TOKEN })
    })
  })
  plugin.unregister.mockReset().mockResolvedValue(undefined)
})

describe('enablePush', () => {
  it('asks permission, registers the device and tells the server', async () => {
    const { enablePush, isPushEnabled } = await load()

    await expect(enablePush()).resolves.toBe(true)
    expect(fetchMock).toHaveBeenCalledWith('/api/push/subscribe', { method: 'POST', body: { platform: 'ios', token: TOKEN } })
    await expect(isPushEnabled()).resolves.toBe(true)
  })

  it('does not register when the user refuses', async () => {
    plugin.permission = 'denied'
    const { enablePush, isPushEnabled } = await load()

    await expect(enablePush()).resolves.toBe(false)
    expect(plugin.register).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
    await expect(isPushEnabled()).resolves.toBe(false)
  })

  it('reports failure when iOS cannot register the device', async () => {
    plugin.registrationFails = true
    const { enablePush } = await load()

    await expect(enablePush()).resolves.toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports failure where push does not exist, such as a desktop browser', async () => {
    plugin.checkPermissions.mockRejectedValue(new Error('Not implemented on web.'))
    plugin.requestPermissions.mockRejectedValue(new Error('Not implemented on web.'))
    const { enablePush, isPushEnabled, syncPushDevice, offerPushAfterBooking } = await load()

    await expect(enablePush()).resolves.toBe(false)
    await expect(isPushEnabled()).resolves.toBe(false)
    await expect(syncPushDevice()).resolves.toBeUndefined()
    await expect(offerPushAfterBooking()).resolves.toBeUndefined()
  })
})

describe('disablePush', () => {
  it('removes the device on the server and remembers the choice', async () => {
    const { enablePush, disablePush, isPushEnabled, syncPushDevice } = await load()
    await enablePush()
    fetchMock.mockClear()

    await disablePush()

    expect(fetchMock).toHaveBeenCalledWith('/api/push/unsubscribe', { method: 'POST', body: { token: TOKEN } })
    expect(plugin.unregister).toHaveBeenCalled()
    await expect(isPushEnabled()).resolves.toBe(false)

    // Permission is still granted at the iOS level, but the user switched it off here
    fetchMock.mockClear()
    await syncPushDevice()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('forgetPushDevice', () => {
  it('removes the device on logout without changing the preference', async () => {
    const { enablePush, forgetPushDevice, syncPushDevice } = await load()
    await enablePush()
    fetchMock.mockClear()

    await forgetPushDevice()
    expect(fetchMock).toHaveBeenCalledWith('/api/push/unsubscribe', { method: 'POST', body: { token: TOKEN } })

    // The next user who logs in on this phone gets notifications again
    fetchMock.mockClear()
    await syncPushDevice()
    expect(fetchMock).toHaveBeenCalledWith('/api/push/subscribe', { method: 'POST', body: { platform: 'ios', token: TOKEN } })
  })

  it('does nothing when the device was never registered', async () => {
    const { forgetPushDevice } = await load()

    await forgetPushDevice()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('syncPushDevice', () => {
  it('re-registers a device whose permission is already granted', async () => {
    plugin.permission = 'granted'
    const { syncPushDevice } = await load()

    await syncPushDevice()
    expect(fetchMock).toHaveBeenCalledWith('/api/push/subscribe', { method: 'POST', body: { platform: 'ios', token: TOKEN } })
  })

  it('never shows the permission prompt', async () => {
    const { syncPushDevice } = await load()

    await syncPushDevice()
    expect(plugin.requestPermissions).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('offerPushAfterBooking', () => {
  it('asks once, when permission was never decided', async () => {
    const { offerPushAfterBooking } = await load()

    await offerPushAfterBooking()
    expect(plugin.requestPermissions).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/push/subscribe', expect.anything())
  })

  it('does not ask again after a refusal', async () => {
    plugin.permission = 'denied'
    const { offerPushAfterBooking } = await load()

    await offerPushAfterBooking()
    expect(plugin.requestPermissions).not.toHaveBeenCalled()
  })
})

describe('onPushTap', () => {
  it('passes the action and the notification data to the handler', async () => {
    const { onPushTap } = await load()
    const handler = vi.fn()

    await onPushTap(handler)
    plugin.listeners.get('pushNotificationActionPerformed')?.({
      actionId: 'ROUTE',
      notification: { data: { url: '/lessen', address: 'Emmy van Leersumhof 24a', aps: {} } },
    })

    expect(handler).toHaveBeenCalledWith('ROUTE', { url: '/lessen', address: 'Emmy van Leersumhof 24a', studentId: undefined })
  })
})

describe('forgetPushDevice failure handling', () => {
  it('keeps the token when the server cannot be reached, and still unregisters the device', async () => {
    const { enablePush, forgetPushDevice } = await load()
    await enablePush()
    fetchMock.mockClear().mockRejectedValue(new Error('offline'))

    await expect(forgetPushDevice()).resolves.toBeUndefined()
    expect(plugin.unregister).toHaveBeenCalled()

    // The token is still remembered, so the next attempt tells the server again
    fetchMock.mockClear().mockResolvedValue({ success: true })
    await forgetPushDevice()
    expect(fetchMock).toHaveBeenCalledWith('/api/push/unsubscribe', { method: 'POST', body: { token: TOKEN } })
  })

  it('forgets the token once the server accepted the removal', async () => {
    const { enablePush, forgetPushDevice } = await load()
    await enablePush()
    await forgetPushDevice()
    fetchMock.mockClear()

    await forgetPushDevice()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('deviceToken timeout', () => {
  it('gives up when iOS fires neither event, and removes the listeners', async () => {
    vi.useFakeTimers()
    try {
      plugin.register.mockReset().mockResolvedValue(undefined)
      const { enablePush } = await load()

      const result = enablePush()
      await vi.waitFor(() => expect(plugin.register).toHaveBeenCalled())
      await vi.advanceTimersByTimeAsync(15_000)

      await expect(result).resolves.toBe(false)
      expect(fetchMock).not.toHaveBeenCalled()
      expect(plugin.listeners.size).toBe(0)
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('leaves no timer running once the token arrived', async () => {
    vi.useFakeTimers()
    try {
      const { enablePush } = await load()

      await expect(enablePush()).resolves.toBe(true)
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('leaves no timer running when registration fails', async () => {
    vi.useFakeTimers()
    try {
      plugin.registrationFails = true
      const { enablePush } = await load()

      await expect(enablePush()).resolves.toBe(false)
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('askPushPermissionAtLaunch', () => {
  it('asks when permission was never decided, without contacting the server', async () => {
    const { askPushPermissionAtLaunch } = await load()

    await askPushPermissionAtLaunch()
    expect(plugin.requestPermissions).toHaveBeenCalledTimes(1)
    expect(plugin.permission).toBe('granted')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each(['granted', 'denied'])('does not ask when permission is already %s', async (state) => {
    plugin.permission = state
    const { askPushPermissionAtLaunch } = await load()

    await askPushPermissionAtLaunch()
    expect(plugin.requestPermissions).not.toHaveBeenCalled()
  })

  it('does not ask after the user switched notifications off', async () => {
    const { enablePush, disablePush, askPushPermissionAtLaunch } = await load()
    await enablePush()
    await disablePush()
    plugin.permission = 'prompt'
    plugin.requestPermissions.mockClear()

    await askPushPermissionAtLaunch()
    expect(plugin.requestPermissions).not.toHaveBeenCalled()
  })

  it('resolves silently where push does not exist, such as a desktop browser', async () => {
    plugin.checkPermissions.mockRejectedValue(new Error('Not implemented on web.'))
    plugin.requestPermissions.mockRejectedValue(new Error('Not implemented on web.'))
    const { askPushPermissionAtLaunch } = await load()

    await expect(askPushPermissionAtLaunch()).resolves.toBeUndefined()
  })

  it('lets syncPushDevice register the device afterwards', async () => {
    const { askPushPermissionAtLaunch, syncPushDevice } = await load()

    await askPushPermissionAtLaunch()
    await syncPushDevice()
    expect(fetchMock).toHaveBeenCalledWith('/api/push/subscribe', { method: 'POST', body: { platform: 'ios', token: TOKEN } })
  })
})
