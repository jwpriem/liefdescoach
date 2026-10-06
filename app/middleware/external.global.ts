import { EXTERNAL_ROUTE_NAME } from '~~/config/ios-target'

/**
 * The iOS app only contains the member pages. Any other link matches the app's
 * catch-all route and opens the website instead (the route does not exist on the web).
 */
export default defineNuxtRouteMiddleware((to, from) => {
  if (to.name !== EXTERNAL_ROUTE_NAME) return

  const { apiBase } = useNativeApp()
  window.open(`${apiBase}${to.fullPath}`, '_blank')
  return from.matched.length > 0 ? abortNavigation() : navigateTo('/account')
})
