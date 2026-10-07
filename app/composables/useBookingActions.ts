export const useBookingActions = () => {
  const { user, refresh: refreshUser } = useAuth()
  const { onBehalfOf, clear: clearOnBehalf } = useOnBehalfOf()
  const { refresh: refreshCredits } = useCredits()
  const { call, error, pending } = useApiCall()
  const { isNativeApp } = useNativeApp()
  const toast = useToast()

  async function handleBooking(lesson: any, options: { extraSpot?: boolean; source?: 'regular' | 'classpass' } = {}) {
    await call(async () => {
      const isOnBehalf = onBehalfOf.value && onBehalfOf.value.$id !== user.value?.$id
      const isClasspass = options.source === 'classpass'

      await $fetch('/api/handleBooking', {
        method: 'POST',
        body: {
          lessonId: lesson.$id,
          onBehalfOfUserId: isOnBehalf ? onBehalfOf.value!.$id : null,
          extraSpot: options.extraSpot === true,
          source: isClasspass ? 'classpass' : 'regular',
        }
      })

      await refreshNuxtData(['lessons', 'admin-lessons', 'my-bookings'])
      if (isOnBehalf) {
        clearOnBehalf()
        await refreshNuxtData(['admin-users', 'credit-summary'])
      } else {
        await refreshUser()
        await refreshCredits()
        if (isNativeApp) {
          // The moment a reminder becomes useful: offer notifications, once
          void offerPushAfterBooking()
          toast.add({
            id: 'calendar-offer',
            title: 'Zet de les in je agenda',
            icon: 'i-lucide-calendar-plus',
            color: 'primary',
            actions: [{ label: 'Zet in agenda', onClick: () => { void addLessonToCalendar(lesson) } }],
          })
        }
      }
    })
    if (isNativeApp) void haptic(error.value ? 'error' : 'success')
  }

  async function cancelBooking(booking: any) {
    await call(async () => {
      const isOnBehalf = onBehalfOf.value && onBehalfOf.value.$id !== user.value?.$id

      await $fetch('/api/cancelBooking', {
        method: 'POST',
        body: {
          bookingId: booking.$id,
          onBehalfOfUserId: isOnBehalf ? onBehalfOf.value!.$id : null
        }
      })

      await refreshNuxtData(['lessons', 'admin-lessons', 'my-bookings'])
      if (isOnBehalf) {
        clearOnBehalf()
        await refreshNuxtData(['admin-users', 'credit-summary'])
      } else {
        await refreshUser()
        await refreshCredits()
      }
    })
    if (isNativeApp) void haptic(error.value ? 'error' : 'warning')
  }

  return { handleBooking, cancelBooking, error, pending }
}
