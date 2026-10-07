import { describe, expect, it } from 'vitest'
import { bookingChangePush, creditsEmptyPush, lessonReminderPush } from './pushMessages'

describe('push messages', () => {
  it('builds the lesson reminder with the address for the Route button, expiring when the lesson starts', () => {
    expect(lessonReminderPush('Hatha Yoga', 'Emmy van Leersumhof 24a, 3059 LT Rotterdam', new Date('2026-07-05T09:45:00.000Z'))).toEqual({
      title: 'Morgen yoga!',
      body: 'Je hebt morgen Hatha Yoga — tot dan!',
      url: '/lessen',
      category: 'LESSON_REMINDER',
      address: 'Emmy van Leersumhof 24a, 3059 LT Rotterdam',
      // 09:45 Dutch time in July is 07:45 UTC
      expiresAt: Date.parse('2026-07-05T07:45:00.000Z') / 1000,
    })
  })

  it('builds the booking confirmation for admins', () => {
    expect(bookingChangePush('confirmation', 'Bea', 'Hatha Yoga', 'zondag 11 oktober')).toEqual({
      title: 'Nieuwe boeking',
      body: 'Bea heeft Hatha Yoga geboekt op zondag 11 oktober',
      url: '/account',
      category: 'BOOKING_CHANGE',
    })
  })

  it('builds the cancellation for admins', () => {
    expect(bookingChangePush('cancellation', 'Bea', 'Hatha Yoga', 'zondag 11 oktober')).toMatchObject({
      title: 'Annulering',
      body: 'Bea heeft Hatha Yoga geannuleerd op zondag 11 oktober',
      category: 'BOOKING_CHANGE',
    })
  })

  it('builds the credits-empty notice with the student for the Credits toevoegen button', () => {
    expect(creditsEmptyPush('Bea', 'student_1')).toEqual({
      title: 'Credits op',
      body: 'Bea heeft geen credits meer',
      url: '/account',
      category: 'CREDITS_EMPTY',
      studentId: 'student_1',
    })
  })
})
