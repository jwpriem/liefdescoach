import { describe, expect, it } from 'vitest'
import { PUSH_ACTION, pushDestination } from './push'

describe('pushDestination', () => {
  it('opens the notification url on a plain tap', () => {
    expect(pushDestination('tap', { url: '/lessen' })).toEqual({ path: '/lessen' })
  })

  it('falls back to the account page when a tap carries no url', () => {
    expect(pushDestination('tap', {})).toEqual({ path: '/account' })
  })

  it('opens Maps with the lesson address for Route', () => {
    expect(pushDestination(PUSH_ACTION.route, { address: 'Emmy van Leersumhof 24a, 3059 LT Rotterdam', url: '/lessen' }))
      .toEqual({ maps: 'Emmy van Leersumhof 24a, 3059 LT Rotterdam' })
  })

  it('shows the lessons instead when Route has no address', () => {
    expect(pushDestination(PUSH_ACTION.route, { url: '/lessen' })).toEqual({ path: '/lessen' })
  })

  it('opens the lesson list for Bekijk les', () => {
    expect(pushDestination(PUSH_ACTION.viewLesson, {})).toEqual({ path: '/lessen' })
  })

  it('opens the admin lessons tab for Bekijk deelnemers', () => {
    expect(pushDestination(PUSH_ACTION.viewParticipants, {})).toEqual({ path: '/account?tab=admin-lessen' })
  })

  it('opens the student for Credits toevoegen', () => {
    expect(pushDestination(PUSH_ACTION.addCredits, { studentId: 'student_1' })).toEqual({ path: '/admin/users/student_1' })
  })

  it('opens the user list when Credits toevoegen has no student id', () => {
    expect(pushDestination(PUSH_ACTION.addCredits, {})).toEqual({ path: '/account?tab=gebruikers' })
  })

  it('treats an unknown action like a plain tap', () => {
    expect(pushDestination('SOMETHING_ELSE', { url: '/account' })).toEqual({ path: '/account' })
  })
})
