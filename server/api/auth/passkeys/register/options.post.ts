import { generateRegistrationOptions } from '@simplewebauthn/server'
import { eq } from 'drizzle-orm'
import { passkeyCredentials } from '../../../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { origin, rpID, rpName } = getPasskeyRequestInfo(event)

  const existingCredentials = await db
    .select({
      credentialId: passkeyCredentials.credentialId,
      transports: passkeyCredentials.transports,
    })
    .from(passkeyCredentials)
    .where(eq(passkeyCredentials.studentId, user.$id))

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: Buffer.from(user.$id),
    userName: user.email,
    userDisplayName: user.name,
    attestationType: 'none',
    excludeCredentials: existingCredentials.map((credential) => ({
      id: credential.credentialId,
      transports: parseTransports(credential.transports),
    })),
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'required',
    },
    preferredAuthenticatorType: 'localDevice',
  })

  storePasskeyChallenge(event, 'passkey-register', options.challenge, user.$id)

  return { ...options, origin }
})
