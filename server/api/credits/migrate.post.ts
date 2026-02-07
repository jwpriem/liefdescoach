import { createError } from 'h3'

/**
 * Admin-only endpoint to migrate credits from user prefs to the credits table.
 *
 * IDEMPOTENT: Skips users who already have credits in the table.
 * Skips archived users (prefs.archive === true).
 * Safe to call multiple times from the admin UI.
 *
 * Creates credit_1 rows (valid 6 months) for each user's prefs.credits value.
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
    const validTo = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate()).toISOString()

    let totalMigrated = 0
    let totalSkipped = 0
    let totalArchived = 0
    const details: string[] = []

    for (const user of allUsers) {
        // Skip archived (inactive) users
        if (user.prefs?.archive === true) {
            totalArchived++
            details.push(`${user.name || user.email}: gearchiveerd, overgeslagen`)
            continue
        }

        const creditCount = parseInt(user.prefs?.credits ?? '0', 10)
        if (creditCount <= 0) continue

        // Idempotency check: does this user already have credits?
        const existing = await tablesDB.listRows(
            config.public.database,
            'credits',
            [
                Query.equal('studentId', [user.$id]),
                Query.limit(1),
            ]
        )

        if ((existing.rows?.length ?? 0) > 0) {
            totalSkipped++
            details.push(`${user.name || user.email}: heeft al credits, overgeslagen`)
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
                    type: 'credit_1',
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
        totalArchived,
        details,
    }
})
