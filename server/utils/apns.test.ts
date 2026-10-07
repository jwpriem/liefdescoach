import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const apns = vi.hoisted(() => ({
  clientOptions: [] as any[],
  send: vi.fn(),
}))

vi.mock('apns2', () => ({
  ApnsClient: class {
    constructor(options: any) { apns.clientOptions.push(options) }
    send = apns.send
  },
  Notification: class {
    constructor(public deviceToken: string, public options: any) {}
  },
}))

const CONFIGURED = {
  apnsKey: '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----',
  apnsKeyId: 'KEYID12345',
  apnsTeamId: 'TEAMID1234',
  apnsBundleId: 'com.ravennah.app',
  apnsProduction: false,
  public: {},
}

async function loadSender(config: Record<string, unknown>) {
  vi.resetModules()
  vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue(config))
  return (await import('./apns')).sendApns
}

beforeEach(() => {
  apns.clientOptions.length = 0
  apns.send.mockReset()
  apns.send.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('sendApns', () => {
  it('does nothing and reports failure when APNs is not configured', async () => {
    const sendApns = await loadSender({ ...CONFIGURED, apnsKey: '' })
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(sendApns('token', { title: 'T', body: 'B' })).resolves.toBe('failed')
    expect(apns.send).not.toHaveBeenCalled()
  })

  it('connects to the sandbox with the configured key, restoring its line breaks', async () => {
    const sendApns = await loadSender(CONFIGURED)
    await sendApns('token', { title: 'T', body: 'B' })

    expect(apns.clientOptions[0]).toMatchObject({
      team: 'TEAMID1234',
      keyId: 'KEYID12345',
      defaultTopic: 'com.ravennah.app',
      host: 'api.sandbox.push.apple.com',
      signingKey: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----',
    })
  })

  it('connects to production when configured', async () => {
    const sendApns = await loadSender({ ...CONFIGURED, apnsProduction: true })
    await sendApns('token', { title: 'T', body: 'B' })

    expect(apns.clientOptions[0].host).toBe('api.push.apple.com')
  })

  it('sends title, body, badge, category and tap data', async () => {
    const sendApns = await loadSender(CONFIGURED)
    const outcome = await sendApns('device-token', {
      title: 'Morgen yoga!',
      body: 'Je hebt morgen Hatha Yoga — tot dan!',
      url: '/lessen',
      category: 'LESSON_REMINDER',
      address: 'Emmy van Leersumhof 24a, 3059 LT Rotterdam',
    })

    expect(outcome).toBe('sent')
    const notification = apns.send.mock.calls[0][0]
    expect(notification.deviceToken).toBe('device-token')
    expect(notification.options).toEqual({
      alert: { title: 'Morgen yoga!', body: 'Je hebt morgen Hatha Yoga — tot dan!' },
      badge: 1,
      sound: 'default',
      category: 'LESSON_REMINDER',
      data: { url: '/lessen', address: 'Emmy van Leersumhof 24a, 3059 LT Rotterdam' },
    })
  })

  it('reports Unregistered as an invalid token', async () => {
    const sendApns = await loadSender(CONFIGURED)
    apns.send.mockRejectedValue({ reason: 'Unregistered' })

    await expect(sendApns('token', { title: 'T', body: 'B' })).resolves.toBe('invalid-token')
  })

  it.each([
    ['BadDeviceToken', 'NUXT_APNS_PRODUCTION'],
    ['DeviceTokenNotForTopic', 'NUXT_APNS_BUNDLE_ID'],
  ])('reports %s as a failure (server setting), never an invalid token, and names the cause', async (reason, setting) => {
    const sendApns = await loadSender(CONFIGURED)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    apns.send.mockRejectedValue({ reason })

    await expect(sendApns('token', { title: 'T', body: 'B' })).resolves.toBe('failed')
    expect(error).toHaveBeenCalledWith(expect.stringContaining(setting))
  })

  it('reports any other error as a failure, not an invalid token', async () => {
    const sendApns = await loadSender(CONFIGURED)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    apns.send.mockRejectedValue({ reason: 'TooManyRequests' })

    await expect(sendApns('token', { title: 'T', body: 'B' })).resolves.toBe('failed')
    expect(error).toHaveBeenCalled()
  })

  it('warns once, on the first send, when APNs is not configured', async () => {
    const sendApns = await loadSender({ ...CONFIGURED, apnsKey: '' })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await sendApns('a', { title: 'T', body: 'B' })
    await sendApns('b', { title: 'T', body: 'B' })

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('not configured'))
  })

  it('gives up on a send Apple never answers and leaves no timer pending', async () => {
    vi.useFakeTimers()
    const sendApns = await loadSender(CONFIGURED)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    apns.send.mockReturnValue(new Promise(() => {}))

    const outcome = sendApns('token', { title: 'T', body: 'B' })
    await vi.advanceTimersByTimeAsync(10_000)

    await expect(outcome).resolves.toBe('failed')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('clears the timer when a send settles', async () => {
    vi.useFakeTimers()
    const sendApns = await loadSender(CONFIGURED)

    await expect(sendApns('token', { title: 'T', body: 'B' })).resolves.toBe('sent')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('reuses one client across sends', async () => {
    const sendApns = await loadSender(CONFIGURED)
    await sendApns('a', { title: 'T', body: 'B' })
    await sendApns('b', { title: 'T', body: 'B' })

    expect(apns.clientOptions).toHaveLength(1)
  })

  it('tells Apple to stop trying once the notification has expired, and does not send the expiry as tap data', async () => {
    const sendApns = await loadSender(CONFIGURED)
    await sendApns('device-token', { title: 'T', body: 'B', url: '/lessen', expiresAt: 1_783_237_500 })

    const { options } = apns.send.mock.calls[0][0]
    expect(options.expiration).toBe(1_783_237_500)
    expect(options.data).toEqual({ url: '/lessen' })
  })

  it('sets no expiry when the notification has none', async () => {
    const sendApns = await loadSender(CONFIGURED)
    await sendApns('device-token', { title: 'T', body: 'B' })

    expect(apns.send.mock.calls[0][0].options).not.toHaveProperty('expiration')
  })
})
