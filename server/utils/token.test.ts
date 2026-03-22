import { describe, it, expect } from 'vitest'
import { generateSignedToken, verifySignedToken } from './token'

const SECRET = 'test-secret-key-for-tokens'

describe('generateSignedToken', () => {
  it('returns a base64-encoded payload with signature', () => {
    const token = generateSignedToken({ userId: 'u1', expires: Date.now() + 60000 }, SECRET)
    expect(token).toContain('.')
    const [payload, signature] = token.split('.')
    expect(payload).toBeTruthy()
    expect(signature).toBeTruthy()
  })
})

describe('verifySignedToken', () => {
  it('returns the payload for a valid token', () => {
    const expires = Date.now() + 60000
    const token = generateSignedToken({ userId: 'u1', purpose: 'password-reset', expires }, SECRET)
    const payload = verifySignedToken(token, SECRET, 'password-reset')

    expect(payload.userId).toBe('u1')
    expect(payload.purpose).toBe('password-reset')
    expect(payload.expires).toBe(expires)
  })

  it('throws on invalid signature', () => {
    const token = generateSignedToken({ userId: 'u1', expires: Date.now() + 60000 }, SECRET)
    const tampered = token.slice(0, -4) + 'xxxx'

    expect(() => verifySignedToken(tampered, SECRET)).toThrow()
  })

  it('throws on expired token', () => {
    const token = generateSignedToken({ userId: 'u1', expires: Date.now() - 1000 }, SECRET)

    expect(() => verifySignedToken(token, SECRET)).toThrow()
  })

  it('throws on wrong purpose', () => {
    const token = generateSignedToken({ userId: 'u1', purpose: 'email-verify', expires: Date.now() + 60000 }, SECRET)

    expect(() => verifySignedToken(token, SECRET, 'password-reset')).toThrow()
  })

  it('accepts tokens without purpose when expectedPurpose is set (backward compat)', () => {
    const token = generateSignedToken({ userId: 'u1', expires: Date.now() + 60000 }, SECRET)
    const payload = verifySignedToken(token, SECRET, 'password-reset')

    expect(payload.userId).toBe('u1')
  })

  it('throws on empty token', () => {
    expect(() => verifySignedToken('', SECRET)).toThrow()
  })

  it('throws on malformed token without dot separator', () => {
    expect(() => verifySignedToken('nodot', SECRET)).toThrow()
  })
})
