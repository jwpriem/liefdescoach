import { createError } from 'h3'

/**
 * Admin-only endpoint to migrate credits from user prefs to the credits table.
 *
 * IDEMPOTENT: Skips users who already have credit_legacy rows.
 * Safe to call multiple times from the admin UI.
 *
 * Creates credit_legacy rows (valid 1 year) for each user's prefs.credits value.
 */
export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const { tablesDB, users, Query, ID } = useServerAppwrite()
    const config = useRuntimeConfig()

    // Fetch all users (paginate)
    let allUsers: any[] = []
    let offset = 0
    const limit = 100
    while (true) {
        const res = await users.list([Query.limit(limit), Query.offset(offset)])
        allUsers = allUsers.concat(res.users)
        if (res.users.length < limit) break
        offset += limit
    }

    const now = new Date()
    const validFrom = now.toISOString()
    const validTo = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()

    let totalMigrated = 0
    let totalSkipped = 0
    const details: string[] = []

    for (const user of allUsers) {
        const creditCount = parseInt(user.prefs?.credits ?? '0', 10)
        if (creditCount <= 0) continue

        // Idempotency check
        const existing = await tablesDB.listRows(
            config.public.database,
            'credits',
            [
                Query.equal('studentId', [user.$id]),
                Query.equal('type', ['credit_legacy']),
                Query.limit(1),
            ]
        )

        if ((existing.rows?.length ?? 0) > 0) {
            totalSkipped++
            details.push(`${user.name || user.email}: al gemigreerd`)
            continue
        }

        for (let i = 0; i < creditCount; i++) {
            await tablesDB.createRow(
                config.public.database,
                'credits',
                ID.unique(),
                {
                    studentId: user.$id,
                    bookingId: null,
                    type: 'credit_legacy',
                    validFrom,
                    validTo,
                    createdAt: now.toISOString(),
                    usedAt: null,
                }
            )
        }

        totalMigrated += creditCount
        details.push(`${user.name || user.email}: ${creditCount} credits gemigreerd`)
    }

    return {
        success: true,
        totalMigrated,
        totalSkipped,
        details,
    }
})
