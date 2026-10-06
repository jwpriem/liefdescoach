import { H3Event, setCookie, getCookie, deleteCookie, setResponseHeader } from 'h3'
import crypto from 'node:crypto'
import { nanoid } from 'nanoid'
import { eq, and, gt } from 'drizzle-orm'
import { sessions, students } from '../database/schema'
import { getBearerToken, isNativeAppRequest, SESSION_TOKEN_HEADER } from './native-app'

const SESSION_COOKIE = 'rav_session'
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds
const SESSION_ABSOLUTE_MAX_AGE = 365 * 24 * 60 * 60 // an app session can be renewed for at most a year after login
const SESSION_RENEW_INTERVAL = 24 * 60 * 60 // app sessions slide forward at most once a day

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/** The iOS app carries the token as a bearer header; the website uses the cookie. Never both. */
function readSessionToken(event: H3Event): string | null {
  return isNativeAppRequest(event) ? getBearerToken(event) : getCookie(event, SESSION_COOKIE) ?? null
}

/**
 * Creates a session for the given user. The website gets the session cookie;
 * the iOS app gets the token in a response header and stores it in the Keychain.
 * Returns the raw session token (only needed internally).
 */
export async function createSession(event: H3Event, userId: string): Promise<string> {
  const token = nanoid(48)
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)

  await db.insert(sessions).values({
    id: nanoid(),
    userId,
    tokenHash,
    expiresAt,
  })

  if (isNativeAppRequest(event)) {
    setResponseHeader(event, SESSION_TOKEN_HEADER, token)
  } else {
    setCookie(event, SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    })
  }

  return token
}

/**
 * Reads the session token (cookie or bearer), looks up the session in the database,
 * and returns the associated student (user) or null.
 */
export async function getSessionUser(event: H3Event) {
  const token = readSessionToken(event)
  if (!token) return null

  const tokenHash = hashToken(token)
  const now = new Date()

  const result = await db
    .select({
      sessionId: sessions.id,
      userId: sessions.userId,
      expiresAt: sessions.expiresAt,
      createdAt: sessions.createdAt,
      name: students.name,
      email: students.email,
      isAdmin: students.isAdmin,
      emailVerified: students.emailVerified,
      archived: students.archived,
      reminders: students.reminders,
      pushNotifications: students.pushNotifications,
      dateOfBirth: students.dateOfBirth,
      phone: students.phone,
      phoneRequested: students.phoneRequested,
    })
    .from(sessions)
    .innerJoin(students, eq(sessions.userId, students.id))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        gt(sessions.expiresAt, now)
      )
    )
    .limit(1)

  if (result.length === 0) return null

  const session = result[0]
  // The app has no login cookie to refresh, so an app session in use stays alive
  // but never beyond an absolute lifetime measured from the login
  if (isNativeAppRequest(event) && session.createdAt) {
    const renewedTo = Math.min(
      now.getTime() + SESSION_MAX_AGE * 1000,
      session.createdAt.getTime() + SESSION_ABSOLUTE_MAX_AGE * 1000,
    )
    const gainMs = renewedTo - session.expiresAt.getTime()
    if (gainMs > SESSION_RENEW_INTERVAL * 1000) {
      await db.update(sessions)
        .set({ expiresAt: new Date(renewedTo) })
        .where(eq(sessions.id, session.sessionId))
    }
  }

  return session
}

/**
 * Destroys the current session (deletes from DB and, on the website, clears the cookie).
 */
export async function destroySession(event: H3Event): Promise<void> {
  const token = readSessionToken(event)
  if (token) {
    const tokenHash = hashToken(token)
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash))
  }
  if (!isNativeAppRequest(event)) {
    deleteCookie(event, SESSION_COOKIE, { path: '/' })
  }
}
