import { describe, it, expect, vi, beforeEach } from 'vitest'

let testIpCount = 0

// Mock h3
vi.mock('h3', () => ({
  createError: (opts: any) => {
    const err = new Error(opts.statusMessage) as any
    err.statusCode = opts.statusCode
    err.statusMessage = opts.statusMessage
    return err
  },
  getRequestIP: () => `127.0.0.${testIpCount}`,
}))

import handler from './send.post'

const handle = handler as any
const fakeEvent = () => ({
  waitUntil: vi.fn((p) => p),
} as any)

beforeEach(() => {
  testIpCount++
  vi.restoreAllMocks()
  vi.stubGlobal('readBody', vi.fn())
  vi.stubGlobal('smtpTransport', {
    sendMail: vi.fn().mockResolvedValue(true),
  })
  vi.stubGlobal('contactEmail', vi.fn().mockReturnValue({ subject: 'Contact', html: '<p>Contact</p>', text: 'Contact' }))
  vi.stubGlobal('newUserEmail', vi.fn().mockReturnValue({ subject: 'New User', html: '<p>New User</p>', text: 'New User' }))
})

describe('POST /api/mail/send', () => {
  it('throws 400 when type is missing', async () => {
    vi.mocked(readBody).mockResolvedValue({})
    await expect(handle(fakeEvent())).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Email type is verplicht',
    })
  })

  it('throws 400 when data is missing or not an object', async () => {
    vi.mocked(readBody).mockResolvedValue({ type: 'contact' })
    await expect(handle(fakeEvent())).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Email data is verplicht',
    })
  })

  it('throws 400 when unknown email type is provided', async () => {
    vi.mocked(readBody).mockResolvedValue({ type: 'unknown-type', data: {} })
    await expect(handle(fakeEvent())).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Onbekend email type: unknown-type',
    })
  })

  it('throws 400 when contact fields fail string or length validation', async () => {
    vi.mocked(readBody).mockResolvedValue({
      type: 'contact',
      data: { name: '', email: 'a@b.com', message: 'Hello' },
    })
    await expect(handle(fakeEvent())).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Ongeldige lengte voor naam',
    })

    vi.mocked(readBody).mockResolvedValue({
      type: 'contact',
      data: { name: 'Alice', email: 123, message: 'Hello' },
    })
    await expect(handle(fakeEvent())).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Ongeldige waarde voor e-mailadres',
    })

    vi.mocked(readBody).mockResolvedValue({
      type: 'contact',
      data: { name: 'Alice', email: 'alice@example.com', message: 'a'.repeat(5001) },
    })
    await expect(handle(fakeEvent())).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Ongeldige lengte voor bericht',
    })
  })

  it('succeeds for valid contact payload', async () => {
    vi.mocked(readBody).mockResolvedValue({
      type: 'contact',
      data: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'I would like to join a class!',
      },
    })

    const event = fakeEvent()
    const result = await handle(event)

    expect(result).toEqual({ success: true })
    expect(contactEmail).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'I would like to join a class!',
    })
    expect(event.waitUntil).toHaveBeenCalled()
  })

  it('succeeds for valid new-user payload', async () => {
    vi.mocked(readBody).mockResolvedValue({
      type: 'new-user',
      data: {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '0612345678',
        date: '2025-01-01',
      },
    })

    const event = fakeEvent()
    const result = await handle(event)

    expect(result).toEqual({ success: true })
    expect(newUserEmail).toHaveBeenCalledWith({
      name: 'John Smith',
      email: 'john@example.com',
      phone: '0612345678',
      date: '2025-01-01',
    })
    expect(event.waitUntil).toHaveBeenCalled()
  })

  it('enforces rate limiting after max requests', async () => {
    vi.mocked(readBody).mockResolvedValue({
      type: 'contact',
      data: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'Hello',
      },
    })

    // Send MAX_IP_REQUESTS (5) valid requests
    for (let i = 0; i < 5; i++) {
      await handle(fakeEvent())
    }

    // 6th request should throw rate limit 429
    await expect(handle(fakeEvent())).rejects.toMatchObject({
      statusCode: 429,
      statusMessage: 'Te veel aanvragen vanaf dit IP. Probeer het later opnieuw.',
    })
  })
})
