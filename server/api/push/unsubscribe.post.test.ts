import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './unsubscribe.post'
import { createQueuedDb } from '../../test-utils'

const handle = handler as unknown as (event: any) => Promise<any>

const useDb = (results: any[][] = []) => {
  const db = createQueuedDb(results)
  vi.stubGlobal('db', db)
  return db
}
const withBody = (body: unknown) => vi.stubGlobal('readBody', vi.fn().mockResolvedValue(body))

beforeEach(() => {
  vi.stubGlobal('requireAuth', vi.fn().mockResolvedValue({ $id: 'student_b', labels: [] }))
})

describe('POST /api/push/unsubscribe', () => {
  it('removes an iPhone by its device token', async () => {
    const db = useDb([[{ id: 'other-device' }]])
    withBody({ token: 'a1b2c3d4' })

    await expect(handle({})).resolves.toEqual({ success: true })
    expect(db.delete).toHaveBeenCalled()
    expect(db.update).not.toHaveBeenCalled()
  })

  it('still removes a web subscription by its endpoint and switches the flag off when none remain', async () => {
    const db = useDb([[]])
    withBody({ endpoint: 'https://push.example/abc' })

    await handle({})

    expect(db.delete).toHaveBeenCalled()
    expect(db.updater.set).toHaveBeenCalledWith({ pushNotifications: false })
  })

  it('rejects a request with neither endpoint nor token', async () => {
    useDb()
    withBody({})

    await expect(handle({})).rejects.toMatchObject({ statusCode: 400 })
  })
})
