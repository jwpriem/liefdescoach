import { PUSH_CATEGORY, type PushPayload } from '../../shared/push'

/** The studio's notifications. Each carries the category whose buttons fit it and the data those buttons need. */

export function lessonReminderPush(lessonType: string, address: string): PushPayload {
  return {
    title: 'Morgen yoga!',
    body: `Je hebt morgen ${lessonType} — tot dan!`,
    url: '/lessen',
    category: PUSH_CATEGORY.lessonReminder,
    address,
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
