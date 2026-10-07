/** Someone who receives a shared lesson probably has no account yet, so the link goes to the trial-lesson page. */
export const TRIAL_LESSON_URL = 'https://www.ravennah.com/eerste-les'

export function lessonShareContent(title: string, when: string) {
  return {
    title: 'Yoga Ravennah',
    text: `Ga je mee naar ${title} op ${when}?`,
    url: TRIAL_LESSON_URL,
  }
}

/** The app can always share; a browser only if it has a share feature of its own. */
export function canShareLesson(isNativeApp: boolean): boolean {
  return isNativeApp || (typeof navigator !== 'undefined' && typeof navigator.share === 'function')
}

/** Opens the share sheet for a lesson. Never throws: closing the sheet is not an error. */
export async function shareLesson(isNativeApp: boolean, title: string, when: string): Promise<void> {
  const content = lessonShareContent(title, when)
  try {
    if (isNativeApp) {
      const { Share } = await import('@capacitor/share')
      await Share.share(content)
    } else {
      await navigator.share(content)
    }
  } catch (err: any) {
    // Closing the sheet is not an error; anything else is worth a log line
    const cancelled = err?.name === 'AbortError' || /cancel/i.test(err?.message ?? '')
    if (!cancelled) console.error('[Share] Sharing the lesson failed:', err)
  }
}
