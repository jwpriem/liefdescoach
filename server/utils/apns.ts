import { ApnsClient, Notification } from 'apns2'
import type { PushPayload } from '../../shared/push'

export type PushOutcome = 'sent' | 'invalid-token' | 'failed'

// Apple's answers that mean this device token will never work again for this app
const INVALID_TOKEN_REASONS = new Set(['BadDeviceToken', 'Unregistered', 'DeviceTokenNotForTopic'])

let client: ApnsClient | null | undefined

/** One connection for the lifetime of the server; null when APNs is not configured (local dev, tests). */
function getClient(): ApnsClient | null {
  if (client !== undefined) return client

  const { apnsKey, apnsKeyId, apnsTeamId, apnsBundleId, apnsProduction } = useRuntimeConfig()
  client = apnsKey && apnsKeyId && apnsTeamId && apnsBundleId
    ? new ApnsClient({
        team: apnsTeamId,
        keyId: apnsKeyId,
        // The .p8 key is stored in one env line with \n for its line breaks
        signingKey: apnsKey.replace(/\\n/g, '\n'),
        defaultTopic: apnsBundleId,
        host: apnsProduction ? 'api.push.apple.com' : 'api.sandbox.push.apple.com',
      })
    : null
  return client
}

/** Sends one notification to one iPhone. Never throws. */
export async function sendApns(deviceToken: string, payload: PushPayload): Promise<PushOutcome> {
  const apns = getClient()
  if (!apns) return 'failed'

  const { title, body, category, ...data } = payload
  try {
    await apns.send(new Notification(deviceToken, {
      alert: { title, body },
      badge: 1,
      sound: 'default',
      ...(category ? { category } : {}),
      data,
    }))
    return 'sent'
  } catch (err: any) {
    if (INVALID_TOKEN_REASONS.has(err?.reason)) return 'invalid-token'
    console.error('[Push] APNs send failed:', err?.reason ?? err?.message ?? err)
    return 'failed'
  }
}
