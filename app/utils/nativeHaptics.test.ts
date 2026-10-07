import { beforeEach, describe, expect, it, vi } from 'vitest'

const haptics = vi.hoisted(() => ({ notification: vi.fn() }))

vi.mock('@capacitor/haptics', () => ({
  Haptics: new Proxy(haptics, {
    get(target, key) {
      if (key === 'then') throw new Error('Haptics.then() is not implemented')
      return (target as any)[key]
    },
  }),
  NotificationType: { Success: 'SUCCESS', Warning: 'WARNING', Error: 'ERROR' },
}))

import { haptic } from './nativeHaptics'

beforeEach(() => {
  haptics.notification.mockReset().mockResolvedValue(undefined)
})

describe('haptic', () => {
  it.each([
    ['success', 'SUCCESS'],
    ['warning', 'WARNING'],
    ['error', 'ERROR'],
  ] as const)('plays the %s pattern', async (kind, type) => {
    await haptic(kind)
    expect(haptics.notification).toHaveBeenCalledWith({ type })
  })

  it('never throws, also where the device cannot vibrate', async () => {
    haptics.notification.mockRejectedValue(new Error('Not available'))
    await expect(haptic('success')).resolves.toBeUndefined()
  })
})
