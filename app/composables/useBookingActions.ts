export const useBookingActions = () => {
  const { user, refresh: refreshUser } = useAuth()
  const { onBehalfOf, clear: clearOnBehalf } = useOnBehalfOf()
  const { refresh: refreshCredits } = useCredits()
  const { call, error, pending } = useApiCall()

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
      }
    })
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
  }

  return { handleBooking, cancelBooking, error, pending }
}
