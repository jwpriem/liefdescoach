/**
 * iOS app only: a link to a member page (from a verification or password-reset email, for example)
 * opens that page in the app.
 */
export default defineNuxtPlugin(() => {
  const { isNativeApp, apiBase } = useNativeApp()
  if (!isNativeApp) return

  const router = useRouter()
  void onAppLink((url) => {
    const path = appPathFromLink(url, apiBase)
    if (path) void router.push(path)
  })
})
