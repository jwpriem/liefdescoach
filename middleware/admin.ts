export default defineNuxtRouteMiddleware(async (to, from) => {
    const store = useMainStore()

    if (!store.loggedInUser) {
        await store.getUser()
    }

    if (!store.loggedInUser) {
        return navigateTo('/login')
    }

    if (!store.isAdmin) {
        return navigateTo('/account')
    }
})
