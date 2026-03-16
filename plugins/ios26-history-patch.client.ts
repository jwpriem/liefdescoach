export default defineNuxtPlugin(() => {
    // iOS 26 triggers the Liquid Glass toolbar on any pushState / replaceState call,
    // even when the URL doesn't visually change. Omitting the url argument keeps the
    // browser URL static while Vue Router's internal state (and back navigation) still
    // works correctly because Vue Router reads route info from its own state object.
    const ua = navigator.userAgent
    const isIOS26 = /iPhone|iPad|iPod/.test(ua) && /OS 26_/.test(ua)

    if (!isIOS26) return

    const originalPush = history.pushState.bind(history)
    const originalReplace = history.replaceState.bind(history)

    history.pushState = (data: unknown, unused: string, _url?: string | URL | null) =>
        originalPush(data, unused)

    history.replaceState = (data: unknown, unused: string, _url?: string | URL | null) =>
        originalReplace(data, unused)
})
