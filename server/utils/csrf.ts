import crypto from 'node:crypto'
import { createError, getCookie, getHeader, getMethod, setCookie, type H3Event } from 'h3'

const CSRF_COOKIE = 'rav_csrf'
const CSRF_HEADER = 'x-csrf-token'
const CSRF_MAX_AGE = 60 * 60 * 8 // 8 hours
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export function createCsrfToken(event: H3Event): string {
  const token = crypto.randomBytes(32).toString('base64url')

  setCookie(event, CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CSRF_MAX_AGE,
  })

  return token
}

export function isCsrfSafeMethod(method: string): boolean {
  return SAFE_METHODS.has(method.toUpperCase())
}

export function assertSameOrigin(event: H3Event): void {
  const origin = getHeader(event, 'origin')
  const referer = getHeader(event, 'referer')
  const host = getHeader(event, 'x-forwarded-host') ?? getHeader(event, 'host')
  const forwardedProto = getHeader(event, 'x-forwarded-proto')
  const source = origin ?? referer

  if (!host || !source) {
    throw createError({ statusCode: 403, statusMessage: 'CSRF-controle mislukt' })
  }

  let sourceUrl: URL
  try {
    sourceUrl = new URL(source)
  } catch {
    throw createError({ statusCode: 403, statusMessage: 'CSRF-controle mislukt' })
  }

  const expectedProtocol = forwardedProto ? `${forwardedProto}:` : sourceUrl.protocol

  if (sourceUrl.host !== host || sourceUrl.protocol !== expectedProtocol) {
    throw createError({ statusCode: 403, statusMessage: 'CSRF-controle mislukt' })
  }
}

export function assertValidCsrfToken(event: H3Event): void {
  const cookieToken = getCookie(event, CSRF_COOKIE)
  const headerToken = getHeader(event, CSRF_HEADER)

  if (!cookieToken || !headerToken) {
    throw createError({ statusCode: 403, statusMessage: 'CSRF-token ontbreekt' })
  }

  const cookieBuffer = Buffer.from(cookieToken)
  const headerBuffer = Buffer.from(headerToken)

  if (cookieBuffer.length !== headerBuffer.length || !crypto.timingSafeEqual(cookieBuffer, headerBuffer)) {
    throw createError({ statusCode: 403, statusMessage: 'Ongeldig CSRF-token' })
  }
}

export function requireCsrfProtection(event: H3Event): void {
  if (isCsrfSafeMethod(getMethod(event))) return

  assertSameOrigin(event)
  assertValidCsrfToken(event)
}
