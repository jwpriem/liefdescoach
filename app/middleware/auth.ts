export default defineNuxtRouteMiddleware(async () => {
  const { user, refresh } = useAuth()

  if (!user.value) {
    await refresh({ dedupe: 'defer' })
  }

  if (!user.value) {
    return navigateTo('/login')
  }
})
