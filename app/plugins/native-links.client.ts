/**
 * iOS app only: a link to a member page (from a verification or password-reset email, for example)
 * opens that page in the app.
 */
export default defineNuxtPlugin(() => {
  const { isNativeApp, apiBase } = useNativeApp()
  if (!isNativeApp) return

  const navigate = useNativeNavigation()
  void onAppLink((url) => {
    const path = appPathFromLink(url, apiBase)
    if (path) navigate(path)
  })
})
