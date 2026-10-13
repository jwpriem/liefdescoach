import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './send.post'

vi.stubGlobal('readBody', vi.fn())
vi.stubGlobal('getRequestIP', vi.fn().mockReturnValue('127.0.0.1'))
vi.stubGlobal('contactEmail', vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }))
vi.stubGlobal('newUserEmail', vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }))
vi.stubGlobal('smtpTransport', { sendMail: vi.fn().mockResolvedValue({}) })

describe('POST /api/mail/send', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('throws 400 when type is missing', async () => {
        vi.mocked(readBody).mockResolvedValue({})
        await expect(handler({ waitUntil: vi.fn() } as any)).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'Email type is verplicht',
        })
    })

    it('throws 400 when data is missing or not an object', async () => {
        vi.mocked(readBody).mockResolvedValue({ type: 'contact' })
        await expect(handler({ waitUntil: vi.fn() } as any)).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'Ongeldige data in verzoek',
        })

        vi.mocked(readBody).mockResolvedValue({ type: 'contact', data: 'invalid' })
        await expect(handler({ waitUntil: vi.fn() } as any)).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'Ongeldige data in verzoek',
        })
    })

    it('throws 400 when contact email data fields are invalid', async () => {
        vi.mocked(readBody).mockResolvedValue({
            type: 'contact',
            data: { name: 'Alice', email: 'alice@example.com' }, // missing message
        })
        await expect(handler({ waitUntil: vi.fn() } as any)).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'Ongeldige contactgegevens',
        })
    })

    it('succeeds with valid contact email data', async () => {
        const waitUntil = vi.fn()
        vi.mocked(readBody).mockResolvedValue({
            type: 'contact',
            data: { name: 'Alice', email: 'alice@example.com', message: 'Hello' },
        })

        const res = await handler({ waitUntil } as any)
        expect(res).toEqual({ success: true })
        expect(waitUntil).toHaveBeenCalled()
    })
})
