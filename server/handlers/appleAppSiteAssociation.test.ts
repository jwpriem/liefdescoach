import { describe, expect, it } from 'vitest'
import { appleAppSiteAssociation } from './appleAppSiteAssociation'

describe('apple-app-site-association', () => {
  const { details } = appleAppSiteAssociation().applinks

  it('names the app by team id and bundle id', () => {
    expect(details).toHaveLength(1)
    expect(details[0]!.appIDs).toEqual(['6DK95S2F4D.com.ravennah.app'])
  })

  it('claims every member path and what lies below it', () => {
    const paths = details[0]!.components.map((component) => component['/'])
    expect(paths).toEqual(expect.arrayContaining([
      '/login', '/lessen', '/account', '/archief', '/admin', '/admin/*', '/verify-email', '/reset-wachtwoord',
    ]))
  })

  it('claims no marketing path', () => {
    const paths = details[0]!.components.map((component) => component['/'])
    expect(paths).not.toContain('/')
    expect(paths).not.toContain('/*')
    expect(paths.some((path) => path.startsWith('/tarieven') || path.startsWith('/eerste-les'))).toBe(false)
  })
})
