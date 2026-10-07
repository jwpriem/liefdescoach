import { PUSH_CATEGORY, type PushPayload } from '../../shared/push'
import { lessonStartInstant } from '../../shared/lesson'

/** The studio's notifications. Each carries the category whose buttons fit it and the data those buttons need. */

export function lessonReminderPush(lessonType: string, address: string, lessonDate: Date): PushPayload {
  return {
    title: 'Morgen yoga!',
    body: `Je hebt morgen ${lessonType} — tot dan!`,
    url: '/lessen',
    category: PUSH_CATEGORY.lessonReminder,
    address,
    // A phone that was off should not show "tomorrow" after the lesson has begun
    expiresAt: Math.floor(lessonStartInstant(lessonDate).getTime() / 1000),
  }
}

export function bookingChangePush(kind: 'confirmation' | 'cancellation', studentName: string, lessonType: string, formattedDate: string): PushPayload {
  const isConfirmation = kind === 'confirmation'
  return {
    title: isConfirmation ? 'Nieuwe boeking' : 'Annulering',
    body: `${studentName} heeft ${lessonType} ${isConfirmation ? 'geboekt' : 'geannuleerd'} op ${formattedDate}`,
    url: '/account',
    category: PUSH_CATEGORY.bookingChange,
  }
}

export function creditsEmptyPush(studentName: string, studentId: string): PushPayload {
  return {
    title: 'Credits op',
    body: `${studentName} heeft geen credits meer`,
    url: '/account',
    category: PUSH_CATEGORY.creditsEmpty,
    studentId,
  }
}
