import { describe, it, expect } from 'vitest'
import { nestLessonsWithBookings } from './queries'

const lesson = { id: 'lesson-1', date: new Date('2026-10-04T07:45:00Z'), type: 'hatha', teacher: 'Ravennah', maxSpots: 9 }
const booking = {
    id: 'booking-1', lessonId: 'lesson-1', source: 'classpass', isFirstTime: true,
    studentId: 'student-b', studentName: 'Bea', studentEmail: 'bea@test.nl',
}

describe('nestLessonsWithBookings', () => {
    it('exposes only the booking source on the public feed', () => {
        const { rows } = nestLessonsWithBookings([lesson], [booking])
        expect(rows[0].bookings).toEqual([{ source: 'classpass' }])
    })

    it('defaults a missing source to regular so spot counts stay correct', () => {
        const { rows } = nestLessonsWithBookings([lesson], [{ ...booking, source: null }])
        expect(rows[0].bookings).toEqual([{ source: 'regular' }])
    })

    it('keeps full student details for admin views', () => {
        const { rows } = nestLessonsWithBookings([lesson], [booking], true)
        expect(rows[0].bookings[0]).toMatchObject({
            $id: 'booking-1',
            students: { $id: 'student-b', name: 'Bea', email: 'bea@test.nl' },
        })
    })
})
