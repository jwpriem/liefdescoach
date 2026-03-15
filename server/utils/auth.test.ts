import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requireAuth, requireAdmin } from './auth'

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
