import { describe, expect, it } from 'vitest'
import { parseSessionRequest } from './sessionRequest'

const valid = { type: 'teamuitje', name: ' Bea ', email: 'bea@example.test', location: 'studio' }

describe('parseSessionRequest', () => {
  it('accepts a complete request and trims the fields', () => {
    const parsed = parseSessionRequest({ ...valid, participants: ' 12 ', message: 'Graag in juni' })

    expect(parsed).toEqual({
      request: {
        type: 'teamuitje',
        name: 'Bea',
        email: 'bea@example.test',
        phone: '',
        date: '',
        participants: '12',
        location: 'studio',
        place: '',
        message: 'Graag in juni',
      },
    })
  })

  it('keeps the place only for a session on location', () => {
    const onLocation = parseSessionRequest({ ...valid, location: 'op-locatie', place: 'Gouda' })
    const inStudio = parseSessionRequest({ ...valid, location: 'studio', place: 'Gouda' })

    expect('request' in onLocation && onLocation.request.place).toBe('Gouda')
    expect('request' in inStudio && inStudio.request.place).toBe('')
  })

  it('treats an unknown location as not yet known', () => {
    const parsed = parseSessionRequest({ ...valid, location: 'maan' })

    expect('request' in parsed && parsed.request.location).toBe('onbekend')
  })

  it.each([
    [{ ...valid, type: 'bruiloft' }, 'Kies waarvoor je een sessie wilt aanvragen'],
    [{ ...valid, name: '  ' }, 'Vul je naam in'],
    [{ ...valid, email: 'bea' }, 'Vul een geldig e-mailadres in'],
    [null, 'Kies waarvoor je een sessie wilt aanvragen'],
  ])('rejects %o', (input, error) => {
    expect(parseSessionRequest(input)).toEqual({ error })
  })
})
