import { pushDestination } from '~~/shared/push'

/**
 * iOS app only: keeps this phone registered for the logged-in user's notifications,
 * and takes the user to the right place when they tap one.
 */
export default defineNuxtPlugin(() => {
  if (!useNativeApp().isNativeApp) return

  const { user } = useAuth()
  const navigate = useNativeNavigation()

  // First ask (once, if the user never decided), then keep the logged-in user's device registered.
  // The watcher starts after the question is settled so a fresh "allow" registers straight away.
  void askPushPermissionAtLaunch().then(() => {
    watch(() => user.value?.$id, (id) => {
      if (id) void syncPushDevice()
    }, { immediate: true })
  })

  void onPushTap((actionId, data) => {
    const destination = pushDestination(actionId, data)
    if ('maps' in destination) {
      window.open(`https://maps.apple.com/?daddr=${encodeURIComponent(destination.maps)}`, '_blank')
    } else {
      navigate(destination.path)
    }
  })
})
