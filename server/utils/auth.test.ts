import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requireAuth, requireAdmin, requireSelfOrAdmin } from './auth'
import { asUser } from '../test-utils'

describe('requireAuth', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('throws 401 when there is no session user', async () => {
    vi.stubGlobal('getSessionUser', vi.fn().mockResolvedValue(null))

    await expect(requireAuth({} as any)).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Niet ingelogd',
    })
  })

  it('maps a normal user to auth shape without admin label', async () => {
    vi.stubGlobal('getSessionUser', vi.fn().mockResolvedValue({
      userId: 'user_1',
      email: 'test@example.com',
      name: 'Test User',
      isAdmin: false,
    }))

    await expect(requireAuth({} as any)).resolves.toEqual({
      $id: 'user_1',
      email: 'test@example.com',
      name: 'Test User',
      labels: [],
    })
  })

  it('maps isAdmin=true to admin label', async () => {
    vi.stubGlobal('getSessionUser', vi.fn().mockResolvedValue({
      userId: 'admin_1',
      email: 'admin@example.com',
      name: 'Admin User',
      isAdmin: true,
    }))

    await expect(requireAuth({} as any)).resolves.toEqual({
      $id: 'admin_1',
      email: 'admin@example.com',
      name: 'Admin User',
      labels: ['admin'],
    })
  })
})

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('throws 403 for authenticated non-admin users', async () => {
    vi.stubGlobal('getSessionUser', vi.fn().mockResolvedValue({
      userId: 'user_2',
      email: 'user@example.com',
      name: 'User',
      isAdmin: false,
    }))

    await expect(requireAdmin({} as any)).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'Geen toegang',
    })
  })

  it('returns user for admins', async () => {
    vi.stubGlobal('getSessionUser', vi.fn().mockResolvedValue({
      userId: 'admin_2',
      email: 'admin2@example.com',
      name: 'Admin 2',
      isAdmin: true,
    }))

    await expect(requireAdmin({} as any)).resolves.toEqual({
      $id: 'admin_2',
      email: 'admin2@example.com',
      name: 'Admin 2',
      labels: ['admin'],
    })
  })
})

describe('requireSelfOrAdmin', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it.each([undefined, null, ''])('treats %s as the logged-in user', async (requested) => {
    asUser('student-a')
    await expect(requireSelfOrAdmin({} as any, requested)).resolves.toMatchObject({
      targetId: 'student-a',
      isOnBehalf: false,
    })
  })

  it('lets a student act on their own id', async () => {
    asUser('student-a')
    await expect(requireSelfOrAdmin({} as any, 'student-a')).resolves.toMatchObject({
      targetId: 'student-a',
      isOnBehalf: false,
    })
  })

  it('rejects a student acting on another student with 403', async () => {
    asUser('student-a')
    await expect(requireSelfOrAdmin({} as any, 'student-b')).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'Geen toegang',
    })
  })

  it('lets an admin act on another student', async () => {
    asUser('admin-1', { admin: true })
    await expect(requireSelfOrAdmin({} as any, 'student-b')).resolves.toMatchObject({
      targetId: 'student-b',
      isOnBehalf: true,
    })
  })

  it('treats an admin passing their own id as self (not on behalf)', async () => {
    asUser('admin-1', { admin: true })
    await expect(requireSelfOrAdmin({} as any, 'admin-1')).resolves.toMatchObject({
      targetId: 'admin-1',
      isOnBehalf: false,
    })
  })

  it.each([123, ['student-b'], { id: 'student-b' }])('rejects non-string id %j with 400', async (requested) => {
    asUser('admin-1', { admin: true })
    await expect(requireSelfOrAdmin({} as any, requested)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 401 without a session', async () => {
    vi.stubGlobal('getSessionUser', vi.fn().mockResolvedValue(null))
    await expect(requireSelfOrAdmin({} as any, 'student-b')).rejects.toMatchObject({ statusCode: 401 })
  })
})
