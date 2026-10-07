export type HapticKind = 'success' | 'warning' | 'error'

/** iOS app: a short tap the user feels when something worked, was undone, or failed. Never throws. */
export async function haptic(kind: HapticKind): Promise<void> {
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics')
    const types = { success: NotificationType.Success, warning: NotificationType.Warning, error: NotificationType.Error }
    await Haptics.notification({ type: types[kind] })
  } catch {
    // No haptics on this device: nothing to do
  }
}
