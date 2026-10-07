import { describe, expect, it } from 'vitest'
import { EXTERNAL_ROUTE_NAME, isMemberPath, toIosPages } from './ios-target'

const page = (path: string) => ({ path, file: `/pages${path}.vue` })

describe('toIosPages', () => {
  const result = toIosPages(
    [page('/'), page('/tarieven'), page('/lessen'), page('/lessen-info'), page('/login'), page('/account'),
      page('/archief'), page('/admin/users/:id()'), page('/verify-email'), page('/reset-wachtwoord'), page('/contact')],
    '/abs/external.vue',
  )
  const paths = result.map((p) => p.path)

  it('keeps every member page', () => {
    expect(paths).toEqual(expect.arrayContaining([
      '/lessen', '/login', '/account', '/archief', '/admin/users/:id()', '/verify-email', '/reset-wachtwoord',
    ]))
  })

  it('drops marketing pages, including ones that only share a prefix', () => {
    expect(paths).not.toContain('/tarieven')
    expect(paths).not.toContain('/contact')
    expect(paths).not.toContain('/lessen-info')
  })

  it('redirects the root to the account page', () => {
    expect(result.find((p) => p.path === '/')).toEqual({ path: '/', redirect: '/account' })
  })

  it('adds a catch-all route for links that leave the member area', () => {
    expect(result.at(-1)).toEqual({ name: EXTERNAL_ROUTE_NAME, path: '/:path(.*)*', file: '/abs/external.vue' })
  })
})

describe('isMemberPath', () => {
  it('accepts member paths and everything below them', () => {
    for (const path of ['/login', '/lessen', '/account', '/archief', '/admin/users/abc', '/verify-email', '/reset-wachtwoord']) {
      expect(isMemberPath(path), path).toBe(true)
    }
  })

  it('rejects marketing paths, the root and look-alikes', () => {
    for (const path of ['/', '/tarieven', '/eerste-les', '/lessen-info', '/accounts', '']) {
      expect(isMemberPath(path), path).toBe(false)
    }
  })
})
