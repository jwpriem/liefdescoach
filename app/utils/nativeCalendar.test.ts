import { beforeEach, describe, expect, it, vi } from 'vitest'

const calendar = vi.hoisted(() => ({ createEventWithPrompt: vi.fn() }))

vi.mock('@ebarooni/capacitor-calendar', () => ({
  // Like a real Capacitor plugin: a Proxy that refuses to be treated as a promise
  CapacitorCalendar: new Proxy(calendar, {
    get(target, key) {
      if (key === 'then') throw new Error('CapacitorCalendar.then() is not implemented')
      return (target as any)[key]
    },
  }),
}))

import { addLessonToCalendar, lessonCalendarEvent } from './nativeCalendar'

const lesson = { type: 'hatha yoga', teacher: null, date: '2026-07-05T09:45:00.000Z' }

beforeEach(() => {
  calendar.createEventWithPrompt.mockReset().mockResolvedValue({ id: 'event-1' })
})

describe('lessonCalendarEvent', () => {
  it('describes the lesson at its Dutch clock time, lasting an hour', () => {
    expect(lessonCalendarEvent(lesson)).toEqual({
      title: 'Hatha Yoga les Ravennah',
      location: 'Emmy van Leersumhof 24a, 3059 LT Rotterdam',
      startDate: Date.parse('2026-07-05T07:45:00.000Z'),
      endDate: Date.parse('2026-07-05T08:45:00.000Z'),
    })
  })
})

describe('addLessonToCalendar', () => {
  it('opens the calendar sheet with the lesson filled in', async () => {
    await expect(addLessonToCalendar(lesson)).resolves.toBe(true)
    expect(calendar.createEventWithPrompt).toHaveBeenCalledWith(lessonCalendarEvent(lesson))
  })

  it('reports failure instead of throwing when the calendar cannot be opened', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    calendar.createEventWithPrompt.mockRejectedValue(new Error('Calendar unavailable'))
    await expect(addLessonToCalendar(lesson)).resolves.toBe(false)
    expect(logged).toHaveBeenCalled()
    logged.mockRestore()
  })
})
