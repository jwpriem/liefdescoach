import { generateAuthenticationOptions } from '@simplewebauthn/server'

export default defineEventHandler(async (event) => {
  const { origin, rpID } = getPasskeyRequestInfo(event)

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'required',
  })

  storePasskeyChallenge(event, 'passkey-login', options.challenge)

  return { ...options, origin }
})
