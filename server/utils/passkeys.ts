import { createError, deleteCookie, getCookie, getHeader, getRequestURL, setCookie, type H3Event } from 'h3'
import type { AuthenticatorTransportFuture, WebAuthnCredential } from '@simplewebauthn/server'

const RP_NAME = 'Yoga Ravennah'
const REGISTER_COOKIE = 'rav_passkey_register'
const LOGIN_COOKIE = 'rav_passkey_login'
const CHALLENGE_MAX_AGE = 5 * 60

type ChallengePurpose = 'passkey-register' | 'passkey-login'

type PasskeyChallenge = {
  challenge: string
  purpose: ChallengePurpose
  userId?: string
  expires: number
}

export function getPasskeyRequestInfo(event: H3Event) {
  const origin = getHeader(event, 'origin') || getRequestURL(event).origin
  const hostname = new URL(origin).hostname

  return {
    origin,
    rpID: hostname,
    rpName: RP_NAME,
  }
}

export function storePasskeyChallenge(event: H3Event, purpose: ChallengePurpose, challenge: string, userId?: string) {
  const config = useRuntimeConfig()
  const token = generateSignedToken({
    challenge,
    purpose,
    userId,
    expires: Date.now() + CHALLENGE_MAX_AGE * 1000,
  }, config.sessionSecret)

  setCookie(event, purpose === 'passkey-register' ? REGISTER_COOKIE : LOGIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CHALLENGE_MAX_AGE,
  })
}

export function readPasskeyChallenge(event: H3Event, purpose: ChallengePurpose): PasskeyChallenge {
  const config = useRuntimeConfig()
  const cookieName = purpose === 'passkey-register' ? REGISTER_COOKIE : LOGIN_COOKIE
  const token = getCookie(event, cookieName)

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Passkey-verzoek is verlopen. Probeer opnieuw.' })
  }

  const payload = verifySignedToken(token, config.sessionSecret, purpose)

  if (payload.purpose !== purpose || typeof payload.challenge !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Ongeldig passkey-verzoek' })
  }

  return payload as PasskeyChallenge
}

export function clearPasskeyChallenge(event: H3Event, purpose: ChallengePurpose) {
  deleteCookie(event, purpose === 'passkey-register' ? REGISTER_COOKIE : LOGIN_COOKIE, { path: '/' })
}

export function encodeCredentialBytes(value: Uint8Array): string {
  return Buffer.from(value).toString('base64url')
}

export function decodeCredentialBytes(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, 'base64url'))
}

export function parseTransports(value?: string | null): AuthenticatorTransportFuture[] | undefined {
  if (!value) return undefined

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

export function toWebAuthnCredential(credential: {
  credentialId: string
  publicKey: string
  counter: number
  transports?: string | null
}): WebAuthnCredential {
  return {
    id: credential.credentialId,
    publicKey: decodeCredentialBytes(credential.publicKey),
    counter: credential.counter,
    transports: parseTransports(credential.transports),
  }
}
