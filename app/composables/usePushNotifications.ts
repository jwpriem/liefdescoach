export const usePushNotifications = () => {
  const config = useRuntimeConfig()
  const isSupported = ref(false)
  const isSubscribed = ref(false)
  const permissionState = ref<NotificationPermission>('default')

  if (import.meta.client) {
    isSupported.value = 'serviceWorker' in navigator && 'PushManager' in window
    if (isSupported.value) {
      permissionState.value = Notification.permission
    }
  }

  async function checkSubscription() {
    if (!isSupported.value) return
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      isSubscribed.value = !!subscription
    } catch {
      isSubscribed.value = false
    }
  }

  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  async function subscribe(): Promise<boolean> {
    if (!isSupported.value) return false

    const permission = await Notification.requestPermission()
    permissionState.value = permission
    if (permission !== 'granted') return false

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.public.vapidPublicKey),
      })

      const json = subscription.toJSON()
      await $fetch('/api/push/subscribe', {
        method: 'POST',
        body: {
          endpoint: json.endpoint,
          keys: {
            p256dh: json.keys!.p256dh,
            auth: json.keys!.auth,
          },
        },
      })

      isSubscribed.value = true
      return true
    } catch (err) {
      console.error('[Push] Subscribe failed:', err)
      return false
    }
  }

  async function unsubscribe(): Promise<boolean> {
    if (!isSupported.value) return false

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        const endpoint = subscription.endpoint
        await subscription.unsubscribe()
        await $fetch('/api/push/unsubscribe', {
          method: 'POST',
          body: { endpoint },
        })
      }

      isSubscribed.value = false
      return true
    } catch (err) {
      console.error('[Push] Unsubscribe failed:', err)
      return false
    }
  }

  // Check current subscription state on init
  if (import.meta.client) {
    checkSubscription()
  }

  return {
    isSupported,
    isSubscribed,
    permissionState,
    subscribe,
    unsubscribe,
    checkSubscription,
  }
}
