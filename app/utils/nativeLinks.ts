import { isMemberPath } from '../../config/ios-target'

/**
 * The in-app path for a link that opened the app, or null when the link is not one of this site's member pages.
 * Only links on the site's own origin count: anything else must never steer the app.
 */
export function appPathFromLink(url: string, siteOrigin: string): string | null {
  let link: URL
  try {
    link = new URL(url)
  } catch {
    return null
  }
  if (link.origin !== siteOrigin || !isMemberPath(link.pathname)) return null
  return `${link.pathname}${link.search}`
}

/** iOS app: calls the handler when the app is opened through a link (a universal link from an email, for example). */
export async function onAppLink(handler: (url: string) => void): Promise<void> {
  try {
    const { App } = await import('@capacitor/app')
    await App.addListener('appUrlOpen', ({ url }) => handler(url))
  } catch {
    // No app plugin here (a desktop browser): there are no incoming links to handle
  }
}
