import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock h3
vi.mock('h3', () => ({
  createError: (opts: any) => {
    const err = new Error(opts.statusMessage) as any
    err.statusCode = opts.statusCode
    err.statusMessage = opts.statusMessage
    return err
  },
  defineEventHandler: (handler: any) => handler,
  readBody: vi.fn(),
  getRequestIP: vi.fn(),
}))

import handler from './send.post'

const mockSmtp = {
  sendMail: vi.fn().mockResolvedValue({ accepted: true })
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('smtpTransport', mockSmtp)
  vi.stubGlobal('contactEmail', vi.fn().mockReturnValue({ subject: 'c_subject', html: 'c_html', text: 'c_text' }))
  vi.stubGlobal('newUserEmail', vi.fn().mockReturnValue({ subject: 'u_subject', html: 'u_html', text: 'u_text' }))
})

const handle = handler as any
const fakeEvent = () => ({
  waitUntil: vi.fn(),
} as any)

describe('POST /api/mail/send', () => {
  it('throws 400 when body or type is missing or invalid', async () => {
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue(null))
    await expect(handle(fakeEvent())).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Email type is verplicht'
    })

    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({ type: 123 }))
    await expect(handle(fakeEvent())).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Email type is verplicht'
    })

    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({ type: 'contact' }))
    await expect(handle(fakeEvent())).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Ongeldige aanvraag gegevens'
    })
  })

  it('throws 400 for unknown email type', async () => {
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({
      type: 'invalid-type',
      data: {}
    }))
    await expect(handle(fakeEvent())).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Onbekend email type: invalid-type'
    })
  })

  describe('contact validations', () => {
    it('throws 400 when contact fields are missing or empty', async () => {
      vi.stubGlobal('readBody', vi.fn().mockResolvedValue({
        type: 'contact',
        data: { email: 'test@example.com', message: 'Hello' } // missing name
      }))
      await expect(handle(fakeEvent())).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Naam is verplicht (max 100 tekens)'
      })

      vi.stubGlobal('readBody', vi.fn().mockResolvedValue({
        type: 'contact',
        data: { name: 'A'.repeat(101), email: 'test@example.com', message: 'Hello' } // name too long
      }))
      await expect(handle(fakeEvent())).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Naam is verplicht (max 100 tekens)'
      })

      vi.stubGlobal('readBody', vi.fn().mockResolvedValue({
        type: 'contact',
        data: { name: 'Real Name', email: 'invalid-email', message: 'Hello' } // invalid email
      }))
      await expect(handle(fakeEvent())).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Ongeldig e-mailadres'
      })

      vi.stubGlobal('readBody', vi.fn().mockResolvedValue({
        type: 'contact',
        data: { name: 'Real Name', email: 'test@example.com', message: '' } // missing message
      }))
      await expect(handle(fakeEvent())).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Bericht is verplicht (max 5000 tekens)'
      })

      vi.stubGlobal('readBody', vi.fn().mockResolvedValue({
        type: 'contact',
        data: { name: 'Real Name', email: 'test@example.com', message: 'A'.repeat(5001) } // message too long
      }))
      await expect(handle(fakeEvent())).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Bericht is verplicht (max 5000 tekens)'
      })
    })

    it('successfully sends contact email when fields are valid', async () => {
      vi.stubGlobal('readBody', vi.fn().mockResolvedValue({
        type: 'contact',
        data: { name: '  Test Name  ', email: '  Test@Example.Com  ', message: '  Hello World  ' }
      }))

      let waitUntilPromise: Promise<void> | null = null
      const event = {
        waitUntil: vi.fn((p) => { waitUntilPromise = p })
      } as any

      const result = await handle(event)

      expect(result).toEqual({ success: true })

      if (waitUntilPromise) {
        await waitUntilPromise
      }

      expect(mockSmtp.sendMail).toHaveBeenCalledWith({
        from: 'Yoga Ravennah <info@ravennah.com>',
        to: 'info@ravennah.com',
        subject: 'c_subject',
        html: 'c_html',
        text: 'c_text',
      })
    })
  })

  describe('new-user validations', () => {
    it('throws 400 when new-user fields are missing or empty', async () => {
      vi.stubGlobal('readBody', vi.fn().mockResolvedValue({
        type: 'new-user',
        data: { email: 'test@example.com', date: '2025-01-01' } // missing name
      }))
      await expect(handle(fakeEvent())).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Naam is verplicht (max 100 tekens)'
      })

      vi.stubGlobal('readBody', vi.fn().mockResolvedValue({
        type: 'new-user',
        data: { name: 'Name', email: 'invalid-email', date: '2025-01-01' } // invalid email
      }))
      await expect(handle(fakeEvent())).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Ongeldig e-mailadres'
      })

      vi.stubGlobal('readBody', vi.fn().mockResolvedValue({
        type: 'new-user',
        data: { name: 'Name', email: 'test@example.com', phone: 'invalid-phone-format', date: '2025-01-01' } // invalid phone
      }))
      await expect(handle(fakeEvent())).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Ongeldig telefoonnummer'
      })

      vi.stubGlobal('readBody', vi.fn().mockResolvedValue({
        type: 'new-user',
        data: { name: 'Name', email: 'test@example.com', date: '' } // missing date
      }))
      await expect(handle(fakeEvent())).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Datum is verplicht (max 50 tekens)'
      })
    })

    it('successfully sends new-user email when fields are valid', async () => {
      vi.stubGlobal('readBody', vi.fn().mockResolvedValue({
        type: 'new-user',
        data: { name: '  User Name  ', email: '  user@example.com  ', phone: ' +31612345678 ', date: '  2025-01-01  ' }
      }))

      let waitUntilPromise: Promise<void> | null = null
      const event = {
        waitUntil: vi.fn((p) => { waitUntilPromise = p })
      } as any

      const result = await handle(event)

      expect(result).toEqual({ success: true })

      if (waitUntilPromise) {
        await waitUntilPromise
      }

      expect(mockSmtp.sendMail).toHaveBeenCalledWith({
        from: 'Yoga Ravennah <info@ravennah.com>',
        to: 'info@ravennah.com',
        subject: 'u_subject',
        html: 'u_html',
        text: 'u_text',
      })
    })
  })
})
