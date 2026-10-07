import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
import { bookings, credits, health, loginHistory, otpCodes, passkeyCredentials, pushSubscriptions, sessions, students } from '../database/schema'
import { createQueuedDb } from '../test-utils'
import { deleteAccount, DELETED_ACCOUNT_NAME } from './accountDeletion'

const student = { name: 'Bea de Vries', email: 'bea@example.test' }
const upcoming = [
  { bookingId: 'booking_1', type: 'hatha yoga', teacher: null, date: new Date('2030-01-06T09:45:00.000Z') },
  { bookingId: 'booking_2', type: 'guest lesson', teacher: 'Bo Bol', date: new Date('2030-01-13T09:45:00.000Z') },
]
const future = new Date('2031-01-01T00:00:00.000Z')
const past = new Date('2020-01-01T00:00:00.000Z')
const studentCredits = [
  { bookingId: null, validTo: future },
  { bookingId: null, validTo: future },
  // expired: already worthless
  { bookingId: null, validTo: past },
  // paid for an upcoming booking: released by the deletion, then forfeited
  { bookingId: 'booking_1', validTo: future },
  // paid for a lesson that already took place
  { bookingId: 'booking_past', validTo: future },
]

const useDb = (results: any[][]) => {
  const db = createQueuedDb(results)
  vi.stubGlobal('db', db)
  return db
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('deleteAccount', () => {
  it('returns null and changes nothing for an unknown student', async () => {
    const db = useDb([[]])

    await expect(deleteAccount('nobody')).resolves.toBeNull()
    expect(db.batch).not.toHaveBeenCalled()
  })

  it('reports who was deleted, which lessons were cancelled and how many credits are forfeited', async () => {
    useDb([[student], upcoming, studentCredits])

    await expect(deleteAccount('student_1')).resolves.toEqual({
      name: 'Bea de Vries',
      email: 'bea@example.test',
      cancelledLessons: [
        { type: 'hatha yoga', teacher: null, date: new Date('2030-01-06T09:45:00.000Z') },
        { type: 'guest lesson', teacher: 'Bo Bol', date: new Date('2030-01-13T09:45:00.000Z') },
      ],
      unusedCredits: 3,
    })
  })

  it('wipes the personal fields on the student row and archives it', async () => {
    const db = useDb([[student], [], []])
    await deleteAccount('student_1')

    expect(db.updater.set).toHaveBeenCalledWith({
      name: DELETED_ACCOUNT_NAME,
      email: null,
      passwordHash: null,
      phone: null,
      dateOfBirth: null,
      archived: true,
      emailVerified: false,
      reminders: false,
      pushNotifications: false,
      phoneRequested: false,
    })
  })

  it('does everything in one atomic batch', async () => {
    const db = useDb([[student], upcoming, studentCredits])
    await deleteAccount('student_1')

    expect(db.batch).toHaveBeenCalledTimes(1)
  })

  it('removes health, sessions, passkeys, push subscriptions, login history and email codes', async () => {
    const db = useDb([[student], [], []])
    await deleteAccount('student_1')

    expect(db.delete.mock.calls.map(([table]) => table).slice(1)).toEqual([
      health, sessions, passkeyCredentials, pushSubscriptions, loginHistory, otpCodes,
    ])
  })

  it('releases the credits of upcoming bookings before removing those bookings', async () => {
    const db = useDb([[student], upcoming, []])
    await deleteAccount('student_1')

    expect(db.update.mock.calls.map(([table]) => table)).toEqual([credits, students])
    expect(db.updater.set).toHaveBeenCalledWith({ bookingId: null, usedAt: null })
    expect(db.delete.mock.calls[0][0]).toBe(bookings)
    // order matters for the foreign key from credits to bookings
    expect(db.update.mock.invocationCallOrder[0]).toBeLessThan(db.delete.mock.invocationCallOrder[0])
  })

  it('cancels upcoming bookings without relying on what was read earlier', async () => {
    // the earlier read saw nothing upcoming; a booking made since then must still go
    const db = useDb([[student], [], []])
    await deleteAccount('student_1')

    expect(db.update.mock.calls.map(([table]) => table)).toEqual([credits, students])
    expect(db.delete.mock.calls[0][0]).toBe(bookings)
  })

  it('judges "upcoming" by the Dutch clock, the way lesson dates are stored', async () => {
    // 10:00 in the Netherlands in summer
    vi.useFakeTimers({ now: new Date('2026-07-05T08:00:00.000Z') })
    const db = useDb([[student], [], []])
    await deleteAccount('student_1')

    const upcomingCondition = db.selectChain.where.mock.calls[1][0]
    const { params } = new PgDialect().sqlToQuery(upcomingCondition)
    expect(params).toContain('2026-07-05T10:00:00.000Z')
    expect(params).not.toContain('2026-07-05T08:00:00.000Z')
  })
})
