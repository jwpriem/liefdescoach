import { H3Event, setCookie, getCookie, deleteCookie } from 'h3'
import crypto from 'node:crypto'
import { nanoid } from 'nanoid'
import { eq, and, gt } from 'drizzle-orm'
import { sessions, students } from '../database/schema'

const SESSION_COOKIE = 'rav_session'
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Creates a session for the given user and sets the session cookie.
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

  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })

  return token
}

/**
 * Reads the session cookie, looks up the session in the database,
 * and returns the associated student (user) or null.
 */
export async function getSessionUser(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return null

  const tokenHash = hashToken(token)
  const now = new Date()

  const result = await db
    .select({
      sessionId: sessions.id,
      userId: sessions.userId,
      expiresAt: sessions.expiresAt,
      name: students.name,
      email: students.email,
      isAdmin: students.isAdmin,
      emailVerified: students.emailVerified,
      archived: students.archived,
      reminders: students.reminders,
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

  return result[0]
}

/**
 * Destroys the current session (deletes from DB and clears cookie).
 */
export async function destroySession(event: H3Event): Promise<void> {
  const token = getCookie(event, SESSION_COOKIE)
  if (token) {
    const tokenHash = hashToken(token)
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash))
  }
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}
