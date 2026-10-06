import type { PushNotificationsPlugin } from '@capacitor/push-notifications'
import type { PushTapData } from '~~/shared/push'

/**
 * This iPhone's push notifications: permission, registration with the server, and the user's choice.
 * Every function is safe where push does not exist (a desktop browser): it reports "not enabled" and carries on.
 */

const TOKEN_KEY = 'rav_push_token' // the device token the server knows this phone by
const OFF_KEY = 'rav_push_off' // set when the user switched notifications off in the app
const REGISTRATION_TIMEOUT_MS = 15_000 // iOS normally answers within a second or two

// Loaded on demand so the website bundle never ships the native plugin.
// The plugin is handed to a callback instead of being returned: resolving a promise with
// a Capacitor plugin proxy makes JS call its `then`, which the plugin rejects.
async function withPush<T>(use: (push: PushNotificationsPlugin) => Promise<T>): Promise<T> {
  const { PushNotifications } = await import('@capacitor/push-notifications')
  return use(PushNotifications)
}

async function permission(): Promise<string> {
  return withPush((push) => push.checkPermissions()).then((status) => status.receive, () => 'unavailable')
}

/** Registers with iOS and resolves the device token it hands back. */
function deviceToken(): Promise<string> {
  return withPush(async (push) => {
    let settle!: { resolve: (token: string) => void; reject: (error: Error) => void }
    const token = new Promise<string>((resolve, reject) => { settle = { resolve, reject } })
    const timer = setTimeout(() => settle.reject(new Error('iOS did not answer the registration')), REGISTRATION_TIMEOUT_MS)
    const handles = await Promise.all([
      push.addListener('registration', (registered) => settle.resolve(registered.value)),
      push.addListener('registrationError', (failure) => settle.reject(new Error(failure.error))),
    ])
    try {
      await push.register()
      return await token
    } finally {
      clearTimeout(timer)
      await Promise.all(handles.map((handle) => handle.remove()))
    }
  })
}

async function register(): Promise<boolean> {
  try {
    const token = await deviceToken()
    await $fetch('/api/push/subscribe', { method: 'POST', body: { platform: 'ios', token } })
    localStorage.setItem(TOKEN_KEY, token)
    return true
  } catch (err) {
    console.error('[Push] Registering this device failed:', err)
    return false
  }
}

async function unregister(): Promise<void> {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return
  // Forget the token only once the server removed it; offline, the next attempt can still tell it
  await $fetch('/api/push/unsubscribe', { method: 'POST', body: { token } })
    .then(() => localStorage.removeItem(TOKEN_KEY), () => {})
  await withPush((push) => push.unregister()).catch(() => {})
}

/** The user switches notifications on: asks permission if needed. */
export async function enablePush(): Promise<boolean> {
  const granted = await withPush((push) => push.requestPermissions()).then((status) => status.receive === 'granted', () => false)
  if (!granted) return false

  localStorage.removeItem(OFF_KEY)
  return register()
}

/** The user switches notifications off: stays off until they switch it on again. */
export async function disablePush(): Promise<void> {
  localStorage.setItem(OFF_KEY, '1')
  await unregister()
}

/** On logout: this phone stops receiving the account's notifications; the preference is kept. */
export async function forgetPushDevice(): Promise<void> {
  await unregister()
}

/** After login and at every start: keep the server's token current. Never shows a prompt. */
export async function syncPushDevice(): Promise<void> {
  if (localStorage.getItem(OFF_KEY)) return
  if (await permission() !== 'granted') return
  await register()
}

/** After a booking: the one moment the app asks, and only if the user never decided. */
export async function offerPushAfterBooking(): Promise<void> {
  if (localStorage.getItem(OFF_KEY)) return
  if (await permission() !== 'prompt') return
  await enablePush()
}

export async function isPushEnabled(): Promise<boolean> {
  return !localStorage.getItem(OFF_KEY) && !!localStorage.getItem(TOKEN_KEY) && await permission() === 'granted'
}

/** Calls the handler when the user taps a notification or one of its buttons (`actionId` is `tap` for the notification itself). */
export async function onPushTap(handler: (actionId: string, data: PushTapData) => void): Promise<void> {
  await withPush((push) => push.addListener('pushNotificationActionPerformed', ({ actionId, notification }) => {
    const { url, address, studentId } = notification.data ?? {}
    handler(actionId, { url, address, studentId })
  })).catch(() => {})
}
