import { getRequestURL } from 'h3'

const CSRF_EXCLUDED_API_PATHS = new Set([
  '/api/csrf-token',
  // Cron endpoint gebruikt een server-to-server API key in plaats van browsercookies.
  '/api/sendLessonReminders',
])

export default defineEventHandler((event) => {
  const url = getRequestURL(event)

  if (!url.pathname.startsWith('/api/')) return
  if (CSRF_EXCLUDED_API_PATHS.has(url.pathname)) return

  requireCsrfProtection(event)
})
