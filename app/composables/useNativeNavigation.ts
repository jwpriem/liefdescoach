/**
 * iOS app: navigation triggered from outside the page (a universal link, a tapped notification).
 * Such a request can arrive during a cold start; it waits until the app has mounted and the first
 * "who is logged in" request has settled, so it is not overridden by the initial route or by a login redirect.
 */
export const useNativeNavigation = () => {
  const router = useRouter()
  const { refresh } = useAuth()

  const ready = new Promise<void>((resolve) => onNuxtReady(() => resolve()))
    .then(() => refresh({ dedupe: 'defer' }))

  return createDeferredNavigator(ready, (path) => { void router.push(path) })
}
