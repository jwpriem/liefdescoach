export default defineNuxtRouteMiddleware(async () => {
  const { user, isAdmin, refresh } = useAuth()

  if (!user.value) {
    await refresh()
  }

  if (!user.value) {
    return navigateTo('/login')
  }

  if (!isAdmin.value) {
    return navigateTo('/account')
  }
})
