import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './logout.post'

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('destroySession', vi.fn())
})

const handle = typeof handler === 'function'
  ? handler
  : (handler as any).handler ?? handler

describe('POST /api/auth/logout', () => {
  it('destroys session and returns success', async () => {
    const event = {} as any
    const result = await handle(event)

    expect(result).toEqual({ success: true })
    expect(destroySession).toHaveBeenCalledWith(event)
  })
})
