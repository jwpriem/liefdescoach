/** iOS app: opens the calendar sheet for a lesson, and tells the user when that did not work. */
export const useLessonCalendar = () => {
  const toast = useToast()

  return async (lesson: Parameters<typeof addLessonToCalendar>[0]): Promise<void> => {
    if (await addLessonToCalendar(lesson)) return
    toast.add({
      title: 'Agenda openen mislukt',
      description: 'Probeer het opnieuw via je boekingen.',
      color: 'error',
    })
  }
}
