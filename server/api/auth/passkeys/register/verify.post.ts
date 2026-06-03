import { createError } from 'h3'
import { verifyRegistrationResponse, type RegistrationResponseJSON } from '@simplewebauthn/server'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { passkeyCredentials } from '../../../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<RegistrationResponseJSON>(event)

  if (!body?.id || !body?.response) {
    throw createError({ statusCode: 400, statusMessage: 'Ongeldig passkey-antwoord' })
  }

  const challenge = readPasskeyChallenge(event, 'passkey-register')
  if (challenge.userId !== user.$id) {
    throw createError({ statusCode: 400, statusMessage: 'Ongeldig passkey-verzoek' })
  }

  const { origin, rpID } = getPasskeyRequestInfo(event)

  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge: challenge.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  })

  clearPasskeyChallenge(event, 'passkey-register')

  if (!verification.verified || !verification.registrationInfo) {
    throw createError({ statusCode: 400, statusMessage: 'Passkey instellen is mislukt' })
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo
  const duplicate = await db
    .select({ id: passkeyCredentials.id })
    .from(passkeyCredentials)
    .where(eq(passkeyCredentials.credentialId, credential.id))
    .limit(1)

  if (duplicate.length > 0) {
    throw createError({ statusCode: 409, statusMessage: 'Deze passkey is al ingesteld' })
  }

  await db.insert(passkeyCredentials).values({
    id: nanoid(),
    studentId: user.$id,
    credentialId: credential.id,
    publicKey: encodeCredentialBytes(credential.publicKey),
    counter: credential.counter,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    transports: credential.transports ? JSON.stringify(credential.transports) : null,
  })

  return { success: true }
})
