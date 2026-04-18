export const useBookingActions = () => {
  const { user, isAdmin, refresh: refreshUser } = useAuth()
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

      const lessonIsInPast = new Date(lesson.date) < new Date()
      const target = onBehalfOf.value ?? user.value
      // Classpass bookings skip confirmation mail — the participant often has no email on file.
      if (!isClasspass && !(isAdmin.value && lessonIsInPast) && target?.email) {
        await sendEmail('sendBookingConfirmation', lesson.$id)
      }

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

      const result = await $fetch<any>('/api/cancelBooking', {
        method: 'POST',
        body: {
          bookingId: booking.$id,
          onBehalfOfUserId: isOnBehalf ? onBehalfOf.value!.$id : null
        }
      })

      // Skip cancellation mail for classpass bookings (no login, often no email).
      const target = onBehalfOf.value ?? user.value
      if (booking.source !== 'classpass' && target?.email) {
        await sendEmail('sendBookingCancellation', result.lessonId)
      }

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

  async function sendEmail(type: string, lessonId: string) {
    const emailUser = onBehalfOf.value ?? user.value
    try {
      await $fetch(`/api/${type}`, {
        method: 'POST',
        body: { lessonId, email: emailUser?.email, name: emailUser?.name }
      })
    } catch (e) {
      console.error('sendEmail failed:', type, e)
    }
  }

  return { handleBooking, cancelBooking, error, pending }
}
