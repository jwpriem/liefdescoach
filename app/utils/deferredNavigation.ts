/**
 * Holds navigation requests that arrive while the app is still starting and replays them, in order,
 * once it is ready. After that, requests go straight through.
 */
export function createDeferredNavigator(ready: Promise<unknown>, navigate: (path: string) => void) {
  let isReady = false
  const waiting: string[] = []

  // Whatever happened while starting, do not strand the requests
  void ready.catch(() => {}).then(() => {
    isReady = true
    for (const path of waiting.splice(0)) navigate(path)
  })

  return (path: string) => {
    if (isReady) navigate(path)
    else waiting.push(path)
  }
}
