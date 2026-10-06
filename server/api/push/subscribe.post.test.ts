import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './subscribe.post'
import { asUser, createQueuedDb } from '../../test-utils'

const handle = handler as unknown as (event: any) => Promise<any>
const IOS_TOKEN = 'a1b2c3d4'.repeat(8)

const useDb = (results: any[][] = []) => {
  const db = createQueuedDb(results)
  vi.stubGlobal('db', db)
  return db
}
const withBody = (body: unknown) => vi.stubGlobal('readBody', vi.fn().mockResolvedValue(body))

beforeEach(() => {
  vi.stubGlobal('requireAuth', vi.fn().mockResolvedValue({ $id: 'student_b', labels: [] }))
  vi.stubGlobal('generateId', vi.fn().mockReturnValue('new-id'))
  asUser('student_b')
})

describe('POST /api/push/subscribe', () => {
  it('stores an iPhone device token without web-push keys', async () => {
    const db = useDb([[]])
    withBody({ platform: 'ios', token: IOS_TOKEN })

    await expect(handle({})).resolves.toEqual({ success: true })
    expect(db.inserter.values).toHaveBeenCalledWith({
      id: 'new-id',
      studentId: 'student_b',
      platform: 'ios',
      endpoint: IOS_TOKEN,
      p256dh: null,
      auth: null,
    })
  })

  it('moves a device token to the user who now uses the phone', async () => {
    const db = useDb([[{ id: 'existing', studentId: 'student_a', endpoint: IOS_TOKEN }]])
    withBody({ platform: 'ios', token: IOS_TOKEN })

    await handle({})

    expect(db.insert).not.toHaveBeenCalled()
    expect(db.updater.set).toHaveBeenCalledWith(expect.objectContaining({ studentId: 'student_b', platform: 'ios' }))
  })

  it('rejects an iPhone token that is not a hex string', async () => {
    useDb([[]])
    withBody({ platform: 'ios', token: 'https://not-a-token' })

    await expect(handle({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('still stores a web subscription with its keys', async () => {
    const db = useDb([[]])
    withBody({ endpoint: 'https://push.example/abc', keys: { p256dh: 'key', auth: 'auth' } })

    await handle({})

    expect(db.inserter.values).toHaveBeenCalledWith({
      id: 'new-id',
      studentId: 'student_b',
      platform: 'web',
      endpoint: 'https://push.example/abc',
      p256dh: 'key',
      auth: 'auth',
    })
  })

  it('still rejects a web subscription without keys', async () => {
    useDb([[]])
    withBody({ endpoint: 'https://push.example/abc' })

    await expect(handle({})).rejects.toMatchObject({ statusCode: 400 })
  })
})
