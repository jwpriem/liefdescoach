import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueuedDb } from '../test-utils'
import { deleteAccount, DELETED_ACCOUNT_NAME } from './accountDeletion'

const student = { name: 'Bea de Vries', email: 'bea@example.test' }
const upcoming = [
  { bookingId: 'booking_1', type: 'hatha yoga', teacher: null, date: new Date('2030-01-06T09:45:00.000Z') },
  { bookingId: 'booking_2', type: 'guest lesson', teacher: 'Bo Bol', date: new Date('2030-01-13T09:45:00.000Z') },
]
const unusedCredits = [{ id: 'credit_1' }, { id: 'credit_2' }, { id: 'credit_3' }]

const useDb = (results: any[][]) => {
  const db = createQueuedDb(results)
  vi.stubGlobal('db', db)
  return db
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('deleteAccount', () => {
  it('returns null and changes nothing for an unknown student', async () => {
    const db = useDb([[]])

    await expect(deleteAccount('nobody')).resolves.toBeNull()
    expect(db.batch).not.toHaveBeenCalled()
  })

  it('reports who was deleted, which lessons were cancelled and how many credits were unused', async () => {
    useDb([[student], upcoming, unusedCredits])

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
    const db = useDb([[student], upcoming, unusedCredits])
    await deleteAccount('student_1')

    expect(db.batch).toHaveBeenCalledTimes(1)
  })

  it('removes health, sessions, passkeys, push subscriptions, login history and email codes', async () => {
    const db = useDb([[student], [], []])
    await deleteAccount('student_1')

    // six personal tables, no bookings to remove
    expect(db.delete).toHaveBeenCalledTimes(6)
  })

  it('releases the credits of upcoming bookings before removing those bookings', async () => {
    const db = useDb([[student], upcoming, []])
    await deleteAccount('student_1')

    // credits released + the student row
    expect(db.update).toHaveBeenCalledTimes(2)
    expect(db.updater.set).toHaveBeenCalledWith({ bookingId: null, usedAt: null })
    // six personal tables + the upcoming bookings
    expect(db.delete).toHaveBeenCalledTimes(7)

    const [queries] = db.batch.mock.calls[0]
    expect(queries).toHaveLength(9)
    // order matters for the foreign key from credits to bookings
    const releaseOrder = db.update.mock.invocationCallOrder[0]
    const firstDeleteOrder = db.delete.mock.invocationCallOrder[0]
    expect(releaseOrder).toBeLessThan(firstDeleteOrder)
  })

  it('leaves past bookings and credit rows alone when there is nothing upcoming', async () => {
    const db = useDb([[student], [], unusedCredits])
    await deleteAccount('student_1')

    // only the student row is updated: no credit is touched
    expect(db.update).toHaveBeenCalledTimes(1)
    expect(db.updater.set).not.toHaveBeenCalledWith({ bookingId: null, usedAt: null })
  })
})
