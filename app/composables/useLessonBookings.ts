export function useLessonBookings() {
  const collator = new Intl.Collator()

  function sortStudents(students: any[]) {
    if (!Array.isArray(students)) return []
    return [...students].sort((a, b) => {
      const nameA = a?.students?.name || a?.name || ''
      const nameB = b?.students?.name || b?.name || ''
      // ⚡ Bolt: Optimize sorting performance by reusing an Intl.Collator instance
      return collator.compare(nameA, nameB)
    })
  }

  function getLessonBookingsWithLabels(lessonBookings: any[]) {
    if (!Array.isArray(lessonBookings)) return []

    const counters = new Map<string, number>()
    return sortStudents(lessonBookings).map((booking) => {
      const studentId = booking?.students?.$id || booking?.students?.id || booking?.$id
      const currentCount = counters.get(studentId) ?? 0
      counters.set(studentId, currentCount + 1)

      return {
        ...booking,
        isExtraSpot: currentCount >= 1,
      }
    })
  }

  return { sortStudents, getLessonBookingsWithLabels }
}
