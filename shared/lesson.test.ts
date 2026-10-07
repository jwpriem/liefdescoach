import { describe, expect, it } from 'vitest'
import { calendarLink, lessonAddress, lessonCalendarTitle, lessonStartInstant, lessonTypeLabel, LESSON_DURATION_MS } from './lesson'

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

  it('does not depend on the time zone of the device running it', () => {
    const previous = process.env.TZ
    process.env.TZ = 'America/New_York'
    try {
      expect(lessonStartInstant('2026-07-05T09:45:00.000Z').toISOString()).toBe('2026-07-05T07:45:00.000Z')
    } finally {
      process.env.TZ = previous
    }
  })
})

describe('LESSON_DURATION_MS', () => {
  it('is one hour', () => {
    expect(LESSON_DURATION_MS).toBe(3_600_000)
  })
})
