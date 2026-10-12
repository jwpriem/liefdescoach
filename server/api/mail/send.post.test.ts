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
  getRequestIP: vi.fn().mockReturnValue('127.0.0.1'),
}))

import handler from './send.post'

const mockSmtp = {
  sendMail: vi.fn().mockResolvedValue({ accepted: true }),
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('smtpTransport', mockSmtp)
  vi.stubGlobal('requireAuth', vi.fn())
  vi.stubGlobal('contactEmail', vi.fn().mockReturnValue({ subject: 'Contact', html: 'h', text: 't' }))
  vi.stubGlobal('newUserEmail', vi.fn().mockReturnValue({ subject: 'New User', html: 'h', text: 't' }))
})

const handle = handler as any
const fakeEvent = () => ({
  waitUntil: vi.fn(),
} as any)

describe('POST /api/mail/send', () => {
  it('throws 400 if type is missing', async () => {
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({}))

    await expect(handle(fakeEvent())).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Email type is verplicht',
    })
  })

  it('throws 400 for contact email if data is missing or invalid', async () => {
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({ type: 'contact' }))

    await expect(handle(fakeEvent())).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Data is verplicht',
    })
  })

  it('throws 400 for contact email if required string fields are invalid', async () => {
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({
      type: 'contact',
      data: { name: '', email: 'invalid', message: 'Hello' },
    }))

    await expect(handle(fakeEvent())).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Geldige naam is verplicht',
    })
  })

  it('sends contact email with valid input', async () => {
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({
      type: 'contact',
      data: { name: 'John', email: 'john@example.com', message: 'Hello' },
    }))

    let waitUntilPromise: Promise<void> | null = null
    const event = {
      waitUntil: vi.fn((p) => { waitUntilPromise = p }),
    } as any

    const res = await handle(event)

    expect(res).toEqual({ success: true })
    if (waitUntilPromise) {
      await waitUntilPromise
    }
    expect(mockSmtp.sendMail).toHaveBeenCalled()
  })

  it('throws 401 for new-user email when unauthenticated', async () => {
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({
      type: 'new-user',
      data: { phone: '0612345678' },
    }))
    vi.stubGlobal('requireAuth', vi.fn().mockRejectedValue({
      statusCode: 401,
      statusMessage: 'Niet ingelogd',
    }))

    await expect(handle(fakeEvent())).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Niet ingelogd',
    })
  })

  it('sends new-user email when authenticated using session user details', async () => {
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({
      type: 'new-user',
      data: { phone: '0612345678', date: '01-01-2026' },
    }))
    vi.stubGlobal('requireAuth', vi.fn().mockResolvedValue({
      $id: 'user-1',
      name: 'Auth User',
      email: 'auth@example.com',
    }))

    let waitUntilPromise: Promise<void> | null = null
    const event = {
      waitUntil: vi.fn((p) => { waitUntilPromise = p }),
    } as any

    const res = await handle(event)

    expect(res).toEqual({ success: true })
    if (waitUntilPromise) {
      await waitUntilPromise
    }
    expect(mockSmtp.sendMail).toHaveBeenCalled()
  })
})
