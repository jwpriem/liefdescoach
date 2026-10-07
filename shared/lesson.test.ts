import { describe, expect, it } from 'vitest'
import { calendarLink, dutchClockNow, lessonAddress, lessonCalendarTitle, lessonStartInstant, lessonTypeLabel, LESSON_DURATION_MS } from './lesson'

const hatha = { type: 'hatha yoga', teacher: null }
const peachy = { type: 'peachy bum', teacher: null }
const guest = { type: 'guest lesson', teacher: 'Bo Bol' }

describe('lessonAddress', () => {
  it('is the studio for everything except Peachy Bum', () => {
    expect(lessonAddress(hatha)).toBe('Emmy van Leersumhof 24a, 3059 LT Rotterdam')
    expect(lessonAddress(guest)).toBe('Emmy van Leersumhof 24a, 3059 LT Rotterdam')
    expect(lessonAddress({})).toBe('Emmy van Leersumhof 24a, 3059 LT Rotterdam')
    expect(lessonAddress(peachy)).toBe('Kosboulevard 5, 3059 XZ Rotterdam')
  })
})

describe('lessonTypeLabel', () => {
  it('names the lesson the way emails and notifications do', () => {
    expect(lessonTypeLabel(hatha)).toBe('Hatha Yoga')
    expect(lessonTypeLabel(peachy)).toBe('Peachy Bum')
    expect(lessonTypeLabel(guest)).toBe('Yin-Yang Yoga door gastdocent Bo Bol')
    expect(lessonTypeLabel({})).toBe('Hatha Yoga')
  })
})

describe('lessonCalendarTitle', () => {
  it('is the title of the calendar entry', () => {
    expect(lessonCalendarTitle(hatha)).toBe('Hatha Yoga les Ravennah')
    expect(lessonCalendarTitle(guest)).toBe('Hatha Yoga les Ravennah')
    expect(lessonCalendarTitle(peachy)).toBe('Peachy Bum les Ravennah')
  })
})

describe('calendarLink', () => {
  const start = new Date('2026-10-11T09:45:00.000Z')

  // These exact strings are what the website and the booking emails produce today
  it('builds the same link as before for a regular lesson', () => {
    expect(calendarLink('apple', hatha, start)).toBe(
      'https://calndr.link/d/event/?service=apple&start=2026-10-11%209:45&title=Hatha Yoga les%20Ravennah&timezone=Europe/Amsterdam&location=Emmy%20van%20Leersumhof%2024a%2C%203059%20LT%20Rotterdam',
    )
  })

  it('builds the same link as before for Peachy Bum', () => {
    expect(calendarLink('gmail', peachy, start)).toBe(
      'https://calndr.link/d/event/?service=gmail&start=2026-10-11%209:45&title=Peachy Bum les%20Ravennah&timezone=Europe/Amsterdam&location=Kosboulevard%205%2C%203059%20XZ%20Rotterdam',
    )
  })

  it('does not pad the hour and does pad the minutes', () => {
    expect(calendarLink('outlook', hatha, new Date('2026-10-11T19:05:00.000Z'))).toContain('start=2026-10-11%2019:05&')
    expect(calendarLink('outlook', hatha, new Date('2026-10-11T08:00:00.000Z'))).toContain('start=2026-10-11%208:00&')
  })
})

describe('lessonStartInstant', () => {
  it('turns the stored clock time into the real moment in the Netherlands in summer (UTC+2)', () => {
    expect(lessonStartInstant('2026-07-05T09:45:00.000Z').toISOString()).toBe('2026-07-05T07:45:00.000Z')
  })

  it('does the same in winter (UTC+1)', () => {
    expect(lessonStartInstant(new Date('2026-01-04T09:45:00.000Z')).toISOString()).toBe('2026-01-04T08:45:00.000Z')
  })

  it('is right on the days the clocks change', () => {
    expect(lessonStartInstant('2026-03-28T09:45:00.000Z').toISOString()).toBe('2026-03-28T08:45:00.000Z')
    expect(lessonStartInstant('2026-03-29T09:45:00.000Z').toISOString()).toBe('2026-03-29T07:45:00.000Z')
    expect(lessonStartInstant('2026-10-24T09:45:00.000Z').toISOString()).toBe('2026-10-24T07:45:00.000Z')
    expect(lessonStartInstant('2026-10-25T09:45:00.000Z').toISOString()).toBe('2026-10-25T08:45:00.000Z')
  })

  it('is right in the hours around the changeover', () => {
    expect(lessonStartInstant('2026-03-29T01:30:00.000Z').toISOString()).toBe('2026-03-29T00:30:00.000Z')
    expect(lessonStartInstant('2026-10-25T01:30:00.000Z').toISOString()).toBe('2026-10-24T23:30:00.000Z')
    expect(lessonStartInstant('2026-03-29T03:30:00.000Z').toISOString()).toBe('2026-03-29T01:30:00.000Z')
    expect(lessonStartInstant('2026-10-25T03:30:00.000Z').toISOString()).toBe('2026-10-25T02:30:00.000Z')
  })

  it('gives a valid moment for the hour that does not exist and the hour that happens twice', () => {
    const skipped = lessonStartInstant('2026-03-29T02:30:00.000Z').getTime()
    expect(Math.abs(skipped - Date.parse('2026-03-29T00:30:00.000Z'))).toBeLessThanOrEqual(3_600_000)
    const repeated = lessonStartInstant('2026-10-25T02:30:00.000Z').getTime()
    expect(Math.abs(repeated - Date.parse('2026-10-25T00:30:00.000Z'))).toBeLessThanOrEqual(3_600_000)
    expect(Math.abs(repeated - Date.parse('2026-10-25T01:30:00.000Z'))).toBeLessThanOrEqual(3_600_000)
  })
})

describe('dutchClockNow', () => {
  it('writes the current Dutch clock time as UTC, the way lesson dates are stored, in summer (UTC+2)', () => {
    expect(dutchClockNow(new Date('2026-07-05T07:45:00.000Z')).toISOString()).toBe('2026-07-05T09:45:00.000Z')
  })

  it('does the same in winter (UTC+1)', () => {
    expect(dutchClockNow(new Date('2026-01-04T08:45:00.000Z')).toISOString()).toBe('2026-01-04T09:45:00.000Z')
  })

  it('is the inverse of lessonStartInstant', () => {
    const stored = new Date('2026-10-25T09:45:00.000Z')
    expect(dutchClockNow(lessonStartInstant(stored))).toEqual(stored)
  })
})

describe('LESSON_DURATION_MS', () => {
  it('is one hour', () => {
    expect(LESSON_DURATION_MS).toBe(3_600_000)
  })
})
