const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

export interface ContactRequest {
  name: string
  email: string
  message: string
}

/** Checks a submitted contact form; returns the cleaned request, or the Dutch reason it cannot be sent. */
export function parseContactRequest(input: unknown): { request: ContactRequest } | { error: string } {
  const data = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const name = text(data.name, 100)
  const email = text(data.email, 200).toLowerCase()
  const message = text(data.message, 5000)

  if (!name) return { error: 'Vul je naam in' }
  if (!EMAIL_PATTERN.test(email)) return { error: 'Vul een geldig e-mailadres in' }
  if (!message) return { error: 'Vul een bericht in' }

  return { request: { name, email, message } }
}
