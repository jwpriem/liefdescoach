export default defineEventHandler((event) => ({
  token: createCsrfToken(event),
}))
