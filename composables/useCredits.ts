export const useCredits = () => {
  const { user } = useAuth()
  const studentId = computed(() => user.value?.$id)

  const { data, refresh } = useAsyncData(
    'my-credits',
    () => studentId.value
      ? $fetch('/api/credits/history', { method: 'POST', body: { studentId: studentId.value } })
      : Promise.resolve(null),
    { watch: [studentId] }
  )

  const availableCredits = computed(() => (data.value as any)?.available ?? 0)
  const creditHistory = computed(() => (data.value as any)?.credits ?? [])

  return { availableCredits, creditHistory, refresh }
}
