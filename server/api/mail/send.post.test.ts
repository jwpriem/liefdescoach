import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler, { resetMailSendRateLimit } from './send.post'

const handle = handler as unknown as (event: any) => Promise<any>

const withBody = (body: unknown) => vi.stubGlobal('readBody', vi.fn().mockResolvedValue(body))

describe('POST /api/mail/send', () => {
  let waitUntilPromise: Promise<any> | null = null
  let mockEvent: any

  beforeEach(() => {
    resetMailSendRateLimit()
    waitUntilPromise = null
    mockEvent = {
      waitUntil: vi.fn((p: Promise<any>) => {
        waitUntilPromise = p
      }),
    }
    vi.stubGlobal('smtpTransport', {
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-id' }),
    })
    vi.stubGlobal('contactEmail', vi.fn().mockReturnValue({ subject: 'Contact', html: '<p>Contact</p>', text: 'Contact' }))
    vi.stubGlobal('newUserEmail', vi.fn().mockReturnValue({ subject: 'New User', html: '<p>New</p>', text: 'New' }))
    vi.stubGlobal('sessionRequestEmail', vi.fn().mockReturnValue({ subject: 'Session', html: '<p>Session</p>', text: 'Session' }))
    vi.stubGlobal('requireAuth', vi.fn().mockResolvedValue({
      $id: 'user_123',
      name: 'Echte Yogi',
      email: 'echte@example.com',
      labels: [],
    }))
  })

  it('rejects missing or invalid type with 400', async () => {
    withBody({})
    await expect(handle(mockEvent)).rejects.toMatchObject({ statusCode: 400, statusMessage: 'Email type is verplicht' })

    withBody({ type: 123 })
    await expect(handle(mockEvent)).rejects.toMatchObject({ statusCode: 400, statusMessage: 'Email type is verplicht' })

    withBody({ type: 'unknown-type' })
    await expect(handle(mockEvent)).rejects.toMatchObject({ statusCode: 400, statusMessage: 'Onbekend email type: unknown-type' })
  })

  describe('contact emails', () => {
    it('rejects contact request with missing data object without throwing 500', async () => {
      withBody({ type: 'contact' })
      await expect(handle(mockEvent)).rejects.toMatchObject({ statusCode: 400, statusMessage: 'Vul je naam in' })
    })

    it('rejects contact request with invalid fields', async () => {
      withBody({ type: 'contact', data: { name: '', email: 'jan@example.com', message: 'Hoi' } })
      await expect(handle(mockEvent)).rejects.toMatchObject({ statusCode: 400, statusMessage: 'Vul je naam in' })

      withBody({ type: 'contact', data: { name: 'Jan', email: 'not-an-email', message: 'Hoi' } })
      await expect(handle(mockEvent)).rejects.toMatchObject({ statusCode: 400, statusMessage: 'Vul een geldig e-mailadres in' })

      withBody({ type: 'contact', data: { name: 'Jan', email: 'jan@example.com', message: '   ' } })
      await expect(handle(mockEvent)).rejects.toMatchObject({ statusCode: 400, statusMessage: 'Vul een bericht in' })
    })

    it('sends contact email with sender replyTo address', async () => {
      withBody({
        type: 'contact',
        data: {
          name: 'Jan de Yogi',
          email: 'jan@example.com',
          message: 'Ik wil graag een proefles volgen.',
        },
      })

      const res = await handle(mockEvent)
      expect(res).toEqual({ success: true })

      await waitUntilPromise
      expect(smtpTransport.sendMail).toHaveBeenCalledWith({
        from: 'Yoga Ravennah <info@ravennah.com>',
        to: 'info@ravennah.com',
        replyTo: 'jan@example.com',
        subject: 'Contact',
        html: '<p>Contact</p>',
        text: 'Contact',
      })
    })
  })

  describe('new-user emails', () => {
    it('sends new-user notification email', async () => {
      withBody({
        type: 'new-user',
        data: {
          name: 'Jan',
          email: 'jan@example.com',
          phone: '0612345678',
          date: '01-01-2025',
        },
      })

      const res = await handle(mockEvent)
      expect(res).toEqual({ success: true })

      await waitUntilPromise
      expect(newUserEmail).toHaveBeenCalledWith({
        name: 'Jan',
        email: 'jan@example.com',
        phone: '0612345678',
        date: '01-01-2025',
      })
      expect(smtpTransport.sendMail).toHaveBeenCalledWith(expect.objectContaining({
        to: 'info@ravennah.com',
        subject: 'New User',
      }))
    })
  })

  describe('session-request emails', () => {
    it('rejects invalid session requests with 400', async () => {
      withBody({
        type: 'session-request',
        data: { name: '' },
      })

      await expect(handle(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
    })

    it('sends session request with valid data and replyTo header', async () => {
      withBody({
        type: 'session-request',
        data: {
          type: 'teamuitje',
          name: 'Bea',
          email: 'bea@example.com',
          location: 'studio',
        },
      })

      const res = await handle(mockEvent)
      expect(res).toEqual({ success: true })

      await waitUntilPromise
      expect(smtpTransport.sendMail).toHaveBeenCalledWith(expect.objectContaining({
        to: 'info@ravennah.com',
        replyTo: 'bea@example.com',
        subject: 'Session',
      }))
    })
  })
})
