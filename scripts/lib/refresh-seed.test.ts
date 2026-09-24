import { describe, it, expect, vi } from 'vitest'
import { createAbortGuard } from './refresh-seed'

describe('createAbortGuard', () => {
    it('discards once, however often Ctrl-C is pressed, and exits 130 after the discard', async () => {
        let finishDiscard!: () => void
        const discard = vi.fn(() => new Promise<void>((resolve) => { finishDiscard = resolve }))
        const exit = vi.fn()
        const guard = createAbortGuard(discard, exit)

        guard.onSignal()
        guard.onSignal()
        guard.onSignal()
        expect(discard).toHaveBeenCalledTimes(1)
        expect(exit).not.toHaveBeenCalled() // never exit while the raw seed may still exist

        finishDiscard()
        await guard.settle()
        expect(exit).toHaveBeenCalledWith(130)
    })

    it('makes the refresh wait for an abort in progress instead of continuing', async () => {
        let finishDiscard!: () => void
        const discard = vi.fn(() => new Promise<void>((resolve) => { finishDiscard = resolve }))
        const guard = createAbortGuard(discard, vi.fn())
        const order: string[] = []

        guard.onSignal()
        const continued = guard.settle().then(() => order.push('refresh continues'))
        await Promise.resolve()
        order.push('discard finishes')
        finishDiscard()
        await continued

        expect(order).toEqual(['discard finishes', 'refresh continues'])
        expect(guard.aborted).toBe(true)
    })

    it('does nothing when no signal arrived', async () => {
        const discard = vi.fn()
        const guard = createAbortGuard(discard, vi.fn())

        await guard.settle()
        expect(discard).not.toHaveBeenCalled()
        expect(guard.aborted).toBe(false)
    })
})
