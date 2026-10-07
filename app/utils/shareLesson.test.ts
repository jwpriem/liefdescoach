import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const plugin = vi.hoisted(() => ({ share: vi.fn() }))

vi.mock('@capacitor/share', () => ({
  Share: new Proxy(plugin, {
    get(target, key) {
      if (key === 'then') throw new Error('Share.then() is not implemented')
      return (target as any)[key]
    },
  }),
}))

import { canShareLesson, lessonShareContent, shareLesson } from './shareLesson'

const expected = {
  title: 'Yoga Ravennah',
  text: 'Ga je mee naar Hatha Yoga met Ravennah op zondag 11 oktober van 9.45 tot 10.45 uur?',
  url: 'https://www.ravennah.com/eerste-les',
}

beforeEach(() => {
  plugin.share.mockReset().mockResolvedValue({})
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('lessonShareContent', () => {
  it('invites someone to the lesson and links to the trial-lesson page', () => {
    expect(lessonShareContent('Hatha Yoga met Ravennah', 'zondag 11 oktober van 9.45 tot 10.45 uur')).toEqual(expected)
  })
})

describe('canShareLesson', () => {
  it('is always possible in the app', () => {
    expect(canShareLesson(true)).toBe(true)
  })

  it('depends on the browser on the website', () => {
    vi.stubGlobal('navigator', {})
    expect(canShareLesson(false)).toBe(false)
    vi.stubGlobal('navigator', { share: vi.fn() })
    expect(canShareLesson(false)).toBe(true)
  })
})

describe('shareLesson', () => {
  it('opens the iOS share sheet in the app', async () => {
    await shareLesson(true, 'Hatha Yoga met Ravennah', 'zondag 11 oktober van 9.45 tot 10.45 uur')
    expect(plugin.share).toHaveBeenCalledWith(expected)
  })

  it("uses the browser's own sharing on the website", async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share })

    await shareLesson(false, 'Hatha Yoga met Ravennah', 'zondag 11 oktober van 9.45 tot 10.45 uur')

    expect(share).toHaveBeenCalledWith(expected)
    expect(plugin.share).not.toHaveBeenCalled()
  })

  it('does not throw when the user closes the share sheet', async () => {
    plugin.share.mockRejectedValue(new Error('Share canceled'))
    await expect(shareLesson(true, 'x', 'y')).resolves.toBeUndefined()
  })
})
