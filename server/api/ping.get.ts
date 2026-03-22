/**
 * GET /api/ping
 * Lightweight health check for load balancers and uptime monitors.
 * Verifies the server is running and the database is reachable.
 */
export default defineEventHandler(async () => {
    await db.execute('SELECT 1')
    return { status: 'ok' }
})
