import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ deleteAccount: vi.fn() }))
vi.mock('../../utils/accountDeletion', () => ({ deleteAccount: mocks.deleteAccount }))

import handler from './delete-account.post'

const handle = handler as unknown as (event: any) => Promise<any>
const waited: Promise<unknown>[] = []
const event = { waitUntil: (promise: Promise<unknown>) => { waited.push(promise) } } as any

const asCaller = (user: { $id: string; labels: string[] }) =>
  vi.stubGlobal('requireAuth', vi.fn().mockResolvedValue({ email: 'x@test.nl', name: 'X', ...user }))
const withBody = (body: unknown) => vi.stubGlobal('readBody', vi.fn().mockResolvedValue(body))

beforeEach(() => {
  waited.length = 0
  mocks.deleteAccount.mockReset().mockResolvedValue({
    name: 'Bea de Vries',
    email: 'bea@example.test',
    cancelledLessons: [{ type: 'hatha yoga', teacher: null, date: new Date('2030-01-06T09:45:00.000Z') }],
    unusedCredits: 2,
  })
  vi.stubGlobal('destroySession', vi.fn().mockResolvedValue(undefined))
  vi.stubGlobal('smtpTransport', { sendMail: vi.fn().mockResolvedValue({}) })
  asCaller({ $id: 'student_1', labels: [] })
  withBody({ confirmation: 'VERWIJDER' })
})

describe('POST /api/auth/delete-account', () => {
  it("deletes the caller's own account and ends the session", async () => {
    await expect(handle(event)).resolves.toEqual({ success: true })

    expect(mocks.deleteAccount).toHaveBeenCalledWith('student_1')
    expect(destroySession).toHaveBeenCalledWith(event)
  })

  it('ignores any account id in the request: only the caller can be deleted', async () => {
    withBody({ confirmation: 'VERWIJDER', studentId: 'someone_else', userId: 'someone_else' })

    await handle(event)

    expect(mocks.deleteAccount).toHaveBeenCalledTimes(1)
    expect(mocks.deleteAccount).toHaveBeenCalledWith('student_1')
  })

  it('refuses an admin', async () => {
    asCaller({ $id: 'admin_1', labels: ['admin'] })

    await expect(handle(event)).rejects.toMatchObject({ statusCode: 403 })
    expect(mocks.deleteAccount).not.toHaveBeenCalled()
  })

  it.each([undefined, {}, { confirmation: 'verwijder' }, { confirmation: 'VERWIJDER ' }, { confirmation: 'ja' }])(
    'refuses without the exact confirmation word (%j)',
    async (body) => {
      withBody(body)

      await expect(handle(event)).rejects.toMatchObject({ statusCode: 400 })
      expect(mocks.deleteAccount).not.toHaveBeenCalled()
    },
  )

  it('emails the member at the address the account had, and the studio', async () => {
    await handle(event)
    await Promise.all(waited)

    const sent = (smtpTransport.sendMail as any).mock.calls.map(([mail]: any[]) => mail)
    expect(sent).toHaveLength(2)
    expect(sent.find((mail: any) => mail.to === 'bea@example.test')?.subject).toBe('Je account is verwijderd')
    const studio = sent.find((mail: any) => mail.to === 'info@ravennah.com')
    expect(studio?.subject).toBe('Account verwijderd: Bea de Vries')
    expect(studio?.text).toContain('Hatha Yoga')
    expect(studio?.text).toContain('Ongebruikte credits: 2')
  })

  it('emails only the studio when the account had no email address', async () => {
    mocks.deleteAccount.mockResolvedValue({ name: 'Walk-in', email: null, cancelledLessons: [], unusedCredits: 0 })

    await handle(event)
    await Promise.all(waited)

    const sent = (smtpTransport.sendMail as any).mock.calls.map(([mail]: any[]) => mail)
    expect(sent.map((mail: any) => mail.to)).toEqual(['info@ravennah.com'])
  })

  it('still succeeds when an email cannot be sent', async () => {
    vi.stubGlobal('smtpTransport', { sendMail: vi.fn().mockRejectedValue(new Error('smtp down')) })
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(handle(event)).resolves.toEqual({ success: true })
    await Promise.all(waited)

    expect(logged).toHaveBeenCalled()
  })

  it('answers 404 when the account no longer exists', async () => {
    mocks.deleteAccount.mockResolvedValue(null)

    await expect(handle(event)).rejects.toMatchObject({ statusCode: 404 })
  })
})
