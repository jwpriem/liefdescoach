import { beforeEach, describe, expect, it, vi } from 'vitest'
import { and, eq } from 'drizzle-orm'
import { PgDialect } from 'drizzle-orm/pg-core'
import handler from './unsubscribe.post'
import { pushSubscriptions } from '../../database/schema'
import { createQueuedDb } from '../../test-utils'

const handle = handler as unknown as (event: any) => Promise<any>

const useDb = (results: any[][] = []) => {
  const db = createQueuedDb(results)
  vi.stubGlobal('db', db)
  return db
}
// Renders a condition to its SQL text and parameters, so two conditions can be compared
const render = (condition: any) => new PgDialect().sqlToQuery(condition)
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
    expect(db.deleter.where).toHaveBeenCalled()
    expect(db.update).not.toHaveBeenCalled()
  })

  it('only deletes rows of the caller: the condition holds both the endpoint and the caller\'s id', async () => {
    const db = useDb([[{ id: 'other-device' }]])
    withBody({ token: 'A1B2C3D4' })

    await handle({})

    const condition = render(db.deleter.where.mock.calls[0][0])
    // The token is lower-cased; student_b is the authenticated caller
    expect(condition).toEqual(render(and(
      eq(pushSubscriptions.endpoint, 'a1b2c3d4'),
      eq(pushSubscriptions.studentId, 'student_b'),
    )))
    expect(condition.params).toEqual(['a1b2c3d4', 'student_b'])
  })

  it('still removes a web subscription by its endpoint and switches the flag off when none remain', async () => {
    const db = useDb([[]])
    withBody({ endpoint: 'https://push.example/abc' })

    await handle({})

    expect(db.delete).toHaveBeenCalled()
    expect(db.deleter.where).toHaveBeenCalled()
    expect(db.updater.set).toHaveBeenCalledWith({ pushNotifications: false })
  })

  it('rejects a request with neither endpoint nor token', async () => {
    useDb()
    withBody({})

    await expect(handle({})).rejects.toMatchObject({ statusCode: 400 })
  })
})
