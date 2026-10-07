/**
 * Push notification contract shared by the server (which sends) and the iOS app (which reacts to taps).
 * The same category and action ids are registered natively in ios/App/App/AppDelegate.swift.
 */

export const PUSH_CATEGORY = {
  lessonReminder: 'LESSON_REMINDER',
  bookingChange: 'BOOKING_CHANGE',
  creditsEmpty: 'CREDITS_EMPTY',
} as const

export const PUSH_ACTION = {
  route: 'ROUTE',
  viewLesson: 'VIEW_LESSON',
  viewParticipants: 'VIEW_PARTICIPANTS',
  addCredits: 'ADD_CREDITS',
} as const

export type PushCategory = typeof PUSH_CATEGORY[keyof typeof PUSH_CATEGORY]

/** What a tap needs to know to pick a destination. */
export type PushTapData = { url?: string; address?: string; studentId?: string }

export type PushPayload = PushTapData & { title: string; body: string; category?: PushCategory }

/** Where a tap on a notification or one of its buttons leads: an in-app path, or an address for Maps. */
export function pushDestination(actionId: string, data: PushTapData): { path: string } | { maps: string } {
  const fallback = { path: data.url ?? '/account' }

  switch (actionId) {
    case PUSH_ACTION.route:
      return data.address ? { maps: data.address } : fallback
    case PUSH_ACTION.viewLesson:
      return { path: '/lessen' }
    case PUSH_ACTION.viewParticipants:
      return { path: '/account?tab=admin-lessen' }
    case PUSH_ACTION.addCredits:
      return { path: data.studentId ? `/admin/users/${data.studentId}` : '/account?tab=gebruikers' }
    default:
      return fallback
  }
}
