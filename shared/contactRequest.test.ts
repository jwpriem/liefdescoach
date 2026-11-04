import { describe, expect, it } from 'vitest'
import { parseContactRequest } from './contactRequest'

const valid = { name: '  Yogi Jan  ', email: '  JAN@EXAMPLE.COM  ', message: '  Hallo, ik heb een vraag  ' }

describe('parseContactRequest', () => {
  it('accepts a valid contact request and cleans/trims fields', () => {
    const result = parseContactRequest(valid)
    expect(result).toEqual({
      request: {
        name: 'Yogi Jan',
        email: 'jan@example.com',
        message: 'Hallo, ik heb een vraag',
      },
    })
  })

  it('rejects missing or empty name', () => {
    expect(parseContactRequest({ ...valid, name: '' })).toEqual({ error: 'Vul je naam in' })
    expect(parseContactRequest({ ...valid, name: '   ' })).toEqual({ error: 'Vul je naam in' })
    expect(parseContactRequest({ ...valid, name: 123 })).toEqual({ error: 'Vul je naam in' })
  })

  it('rejects invalid email addresses', () => {
    expect(parseContactRequest({ ...valid, email: '' })).toEqual({ error: 'Vul een geldig e-mailadres in' })
    expect(parseContactRequest({ ...valid, email: 'notanemail' })).toEqual({ error: 'Vul een geldig e-mailadres in' })
    expect(parseContactRequest({ ...valid, email: '@example.com' })).toEqual({ error: 'Vul een geldig e-mailadres in' })
    expect(parseContactRequest({ ...valid, email: null })).toEqual({ error: 'Vul een geldig e-mailadres in' })
  })

  it('rejects missing or empty message', () => {
    expect(parseContactRequest({ ...valid, message: '' })).toEqual({ error: 'Vul een bericht in' })
    expect(parseContactRequest({ ...valid, message: '   ' })).toEqual({ error: 'Vul een bericht in' })
    expect(parseContactRequest({ ...valid, message: undefined })).toEqual({ error: 'Vul een bericht in' })
  })

  it('handles null, undefined, or non-object input gracefully without throwing', () => {
    expect(parseContactRequest(null)).toEqual({ error: 'Vul je naam in' })
    expect(parseContactRequest(undefined)).toEqual({ error: 'Vul je naam in' })
    expect(parseContactRequest('string')).toEqual({ error: 'Vul je naam in' })
  })

  it('enforces maximum length limits on name, email, and message', () => {
    const longName = 'A'.repeat(150)
    const longMessage = 'M'.repeat(6000)
    const parsed = parseContactRequest({
      name: longName,
      email: 'jan@example.com',
      message: longMessage,
    })

    expect('request' in parsed).toBe(true)
    if ('request' in parsed) {
      expect(parsed.request.name.length).toBe(100)
      expect(parsed.request.message.length).toBe(5000)
    }
  })
})
