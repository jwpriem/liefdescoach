export default defineEventHandler(async (event) => {
    await destroySession(event)
    return { success: true }
})
