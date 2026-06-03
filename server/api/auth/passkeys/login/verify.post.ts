import { createError, getHeader, getRequestIP } from 'h3'
import { verifyAuthenticationResponse, type AuthenticationResponseJSON } from '@simplewebauthn/server'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { loginHistory, passkeyCredentials, students } from '../../../../database/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody<AuthenticationResponseJSON>(event)

  if (!body?.id || !body?.response) {
    throw createError({ statusCode: 400, statusMessage: 'Ongeldig passkey-antwoord' })
  }

  const challenge = readPasskeyChallenge(event, 'passkey-login')
  const { origin, rpID } = getPasskeyRequestInfo(event)

  const credentialRows = await db
    .select({
      id: passkeyCredentials.id,
      studentId: passkeyCredentials.studentId,
      credentialId: passkeyCredentials.credentialId,
      publicKey: passkeyCredentials.publicKey,
      counter: passkeyCredentials.counter,
      transports: passkeyCredentials.transports,
      name: students.name,
      email: students.email,
      isAdmin: students.isAdmin,
      emailVerified: students.emailVerified,
    })
    .from(passkeyCredentials)
    .innerJoin(students, eq(passkeyCredentials.studentId, students.id))
    .where(eq(passkeyCredentials.credentialId, body.id))
    .limit(1)

  const passkey = credentialRows[0]
  if (!passkey) {
    throw createError({ statusCode: 401, statusMessage: 'Deze passkey is niet bekend' })
  }

  const verification = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge: challenge.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: toWebAuthnCredential(passkey),
    requireUserVerification: true,
  })

  clearPasskeyChallenge(event, 'passkey-login')

  if (!verification.verified) {
    throw createError({ statusCode: 401, statusMessage: 'Inloggen met passkey is mislukt' })
  }

  await db
    .update(passkeyCredentials)
    .set({
      counter: verification.authenticationInfo.newCounter,
      deviceType: verification.authenticationInfo.credentialDeviceType,
      backedUp: verification.authenticationInfo.credentialBackedUp,
      lastUsedAt: new Date(),
    })
    .where(eq(passkeyCredentials.id, passkey.id))

  await createSession(event, passkey.studentId)

  await db.insert(loginHistory).values({
    id: nanoid(),
    studentId: passkey.studentId,
    ipAddress: getRequestIP(event) || 'unknown',
    userAgent: getHeader(event, 'user-agent') || null,
  })

  return {
    success: true,
    user: {
      $id: passkey.studentId,
      email: passkey.email,
      name: passkey.name,
      labels: passkey.isAdmin ? ['admin'] : [],
      emailVerification: passkey.emailVerified,
    },
  }
})
