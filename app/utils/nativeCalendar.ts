import { LESSON_DURATION_MS, lessonAddress, lessonCalendarTitle, lessonStartInstant, type LessonKind } from '../../shared/lesson'

type DatedLesson = LessonKind & { date: string }

export function lessonCalendarEvent(lesson: DatedLesson) {
  const startDate = lessonStartInstant(lesson.date).getTime()
  return {
    title: lessonCalendarTitle(lesson),
    location: lessonAddress(lesson),
    startDate,
    endDate: startDate + LESSON_DURATION_MS,
  }
}

/**
 * iOS app: opens the system's "new event" sheet with the lesson filled in; the user taps Add.
 * The system sheet writes the event itself, so the app needs no calendar permission.
 */
export async function addLessonToCalendar(lesson: DatedLesson): Promise<boolean> {
  try {
    // Imported here, never returned: a Capacitor plugin proxy must not become a promise result
    const { CapacitorCalendar } = await import('@ebarooni/capacitor-calendar')
    await CapacitorCalendar.createEventWithPrompt(lessonCalendarEvent(lesson))
    return true
  } catch (err) {
    console.error('[Calendar] Adding the lesson failed:', err)
    return false
  }
}
