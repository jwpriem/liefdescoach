import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueuedDb } from '../test-utils'

const mocks = vi.hoisted(() => ({
  webSend: vi.fn(),
  sendApns: vi.fn(),
}))

vi.mock('web-push', () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: mocks.webSend },
}))
vi.mock('./apns', () => ({ sendApns: mocks.sendApns }))

import { sendPushToStudent } from './push'

const payload = { title: 'T', body: 'B', url: '/account' }
const webRow = { id: 'sub_web', platform: 'web', endpoint: 'https://push.example/abc', p256dh: 'key', auth: 'auth' }
const iosRow = { id: 'sub_ios', platform: 'ios', endpoint: 'device-token', p256dh: null, auth: null }

const useDb = (rows: any[]) => {
  const db = createQueuedDb([rows])
  vi.stubGlobal('db', db)
  return db
}

beforeEach(() => {
  mocks.webSend.mockReset().mockResolvedValue(undefined)
  mocks.sendApns.mockReset().mockResolvedValue('sent')
  vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
    vapidPrivateKey: 'private',
    vapidEmail: 'mailto:info@ravennah.com',
    public: { vapidPublicKey: 'public' },
  }))
})

describe('sendPushToStudent', () => {
  it('sends web rows through Web Push and iOS rows through APNs', async () => {
    useDb([webRow, iosRow])

    await expect(sendPushToStudent('student_1', payload)).resolves.toBe(2)
    expect(mocks.webSend).toHaveBeenCalledWith(
      { endpoint: 'https://push.example/abc', keys: { p256dh: 'key', auth: 'auth' } },
      JSON.stringify(payload),
    )
    expect(mocks.sendApns).toHaveBeenCalledWith('device-token', payload)
  })

  it('removes an iPhone token Apple rejects as invalid', async () => {
    const db = useDb([iosRow])
    mocks.sendApns.mockResolvedValue('invalid-token')

    await expect(sendPushToStudent('student_1', payload)).resolves.toBe(0)
    expect(db.delete).toHaveBeenCalled()
  })

  it('keeps an iPhone token after a transient failure or when APNs is not configured', async () => {
    const db = useDb([iosRow])
    mocks.sendApns.mockResolvedValue('failed')

    await expect(sendPushToStudent('student_1', payload)).resolves.toBe(0)
    expect(db.delete).not.toHaveBeenCalled()
  })

  it('removes a web subscription that is gone', async () => {
    const db = useDb([webRow])
    mocks.webSend.mockRejectedValue({ statusCode: 410 })

    await expect(sendPushToStudent('student_1', payload)).resolves.toBe(0)
    expect(db.delete).toHaveBeenCalled()
  })

  it('keeps a web subscription after another error', async () => {
    const db = useDb([webRow])
    mocks.webSend.mockRejectedValue({ statusCode: 500, message: 'boom' })

    await expect(sendPushToStudent('student_1', payload)).resolves.toBe(0)
    expect(db.delete).not.toHaveBeenCalled()
  })

  it('still delivers to iPhones when Web Push is not configured', async () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({ vapidPrivateKey: '', public: { vapidPublicKey: '' } }))
    useDb([webRow, iosRow])

    await expect(sendPushToStudent('student_1', payload)).resolves.toBe(1)
    expect(mocks.webSend).not.toHaveBeenCalled()
    expect(mocks.sendApns).toHaveBeenCalled()
  })
})
