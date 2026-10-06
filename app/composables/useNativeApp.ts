/** The one place that knows whether this bundle runs inside the iOS app. */
export const useNativeApp = () => {
  const { nativeApp, apiBase } = useRuntimeConfig().public
  return { isNativeApp: nativeApp === true, apiBase: apiBase as string }
}
