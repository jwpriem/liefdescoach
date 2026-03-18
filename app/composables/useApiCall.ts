function toFriendlyDutch(e: any): string {
  const code = e?.code ?? e?.response?.status ?? e?.statusCode
  const msg = e?.message ?? String(e)
  const serverMessage = e?.data?.statusMessage ?? e?.statusMessage

  if (serverMessage && /[a-zA-Z]/.test(serverMessage) && !/fetch/i.test(serverMessage)) {
    return serverMessage
  }
  if (code === 409 || /already exists/i.test(msg)) return 'Emailadres is al in gebruik, probeer in te loggen'
  if (/Invalid credentials/i.test(msg) || /Verkeerde/i.test(msg)) return 'Verkeerde e-mailadres of wachtwoord. Probeer opnieuw.'
  if (/password.*at least.*8/i.test(msg) || /minimaal 8/i.test(msg)) return 'Wachtwoord moet minimaal 8 tekens zijn'
  if (code === 429 || /too many requests/i.test(msg)) return 'Te veel pogingen, probeer later opnieuw.'
  if (code === 402) return 'Onvoldoende credits'
  return 'Er is iets verkeerd gegaan.'
}

export const useApiCall = () => {
  const error = ref<string | null>(null)
  const pending = ref(false)

  async function call<T>(fn: () => Promise<T>): Promise<T | null> {
    pending.value = true
    error.value = null
    try {
      return await fn()
    } catch (e: any) {
      console.error(e)
      error.value = toFriendlyDutch(e)
      return null
    } finally {
      pending.value = false
    }
  }

  return { call, error, pending }
}
