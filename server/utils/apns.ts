import { ApnsClient, Notification } from 'apns2'
import type { PushPayload } from '../../shared/push'

export type PushOutcome = 'sent' | 'invalid-token' | 'failed'

// Apple's answer that means this device token will never work again. BadDeviceToken and
// DeviceTokenNotForTopic are server misconfigurations (wrong APNs environment or bundle id), so
// they must never delete a token.
const DEAD_TOKEN_REASON = 'Unregistered'
const MISCONFIGURATION_HINTS: Record<string, string> = {
  BadDeviceToken: 'the token belongs to the other APNs environment: NUXT_APNS_PRODUCTION does not match the build',
  DeviceTokenNotForTopic: 'the bundle id is wrong: check NUXT_APNS_BUNDLE_ID',
}

const SEND_TIMEOUT_MS = 10_000

let warnedUnconfigured = false

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
  if (!apns) {
    if (!warnedUnconfigured) {
      warnedUnconfigured = true
      console.warn('[Push] APNs is not configured (NUXT_APNS_KEY, NUXT_APNS_KEY_ID, NUXT_APNS_TEAM_ID, NUXT_APNS_BUNDLE_ID): iPhone notifications are not sent')
    }
    return 'failed'
  }

  const { title, body, category, ...data } = payload
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`APNs did not answer within ${SEND_TIMEOUT_MS / 1000}s`)), SEND_TIMEOUT_MS)
    })
    await Promise.race([
      apns.send(new Notification(deviceToken, {
        alert: { title, body },
        badge: 1,
        sound: 'default',
        ...(category ? { category } : {}),
        data,
      })),
      timeout,
    ])
    return 'sent'
  } catch (err: any) {
    if (err?.reason === DEAD_TOKEN_REASON) return 'invalid-token'
    const hint = MISCONFIGURATION_HINTS[err?.reason]
    console.error(`[Push] APNs send failed: ${err?.reason ?? err?.message ?? err}${hint ? ` (${hint})` : ''}`)
    return 'failed'
  } finally {
    clearTimeout(timer)
  }
}
