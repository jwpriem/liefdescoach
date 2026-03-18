export const useBookings = () => {
  const { user } = useAuth()
  const studentId = computed(() => user.value?.$id)

  const { data, refresh } = useAsyncData(
    'my-bookings',
    () => studentId.value
      ? $fetch('/api/bookings', { method: 'POST', body: { userId: studentId.value } })
      : Promise.resolve(null),
    { watch: [studentId] }
  )

  const myBookings = computed(() => {
    const rows = (data.value as any)?.rows ?? []
    return rows.filter((b: any) => b.lessons && typeof b.lessons === 'object')
  })

  return { myBookings, refresh }
}
