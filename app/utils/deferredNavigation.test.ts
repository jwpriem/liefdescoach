import { describe, expect, it, vi } from 'vitest'
import { createDeferredNavigator } from './deferredNavigation'

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('createDeferredNavigator', () => {
  it('holds a path until ready resolves, then navigates', async () => {
    let resolve!: () => void
    const navigate = vi.fn()
    const go = createDeferredNavigator(new Promise<void>((r) => { resolve = r }), navigate)

    go('/account')
    expect(navigate).not.toHaveBeenCalled()

    resolve()
    await settle()
    expect(navigate.mock.calls).toEqual([['/account']])
  })

  it('replays early paths in order', async () => {
    let resolve!: () => void
    const navigate = vi.fn()
    const go = createDeferredNavigator(new Promise<void>((r) => { resolve = r }), navigate)

    go('/a')
    go('/b')
    resolve()
    await settle()
    expect(navigate.mock.calls).toEqual([['/a'], ['/b']])
  })

  it('sends a path requested after ready straight through', async () => {
    const navigate = vi.fn()
    const go = createDeferredNavigator(Promise.resolve(), navigate)
    await settle()

    go('/lessen')
    expect(navigate.mock.calls).toEqual([['/lessen']])
  })

  it('still releases waiting paths when ready rejects', async () => {
    let reject!: (error: Error) => void
    const navigate = vi.fn()
    const go = createDeferredNavigator(new Promise<void>((_, r) => { reject = r }), navigate)

    go('/account')
    reject(new Error('boom'))
    await settle()
    expect(navigate.mock.calls).toEqual([['/account']])
  })
})
