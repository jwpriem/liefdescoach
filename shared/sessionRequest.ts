/**
 * Requests for a one-time session (bachelor party, company yoga, workshop, …).
 * The form on /aanvraag and the email it sends (server/api/mail/send.post.ts) use the same lists and checks.
 */

export const SESSION_TYPES = [
  { value: 'vrijgezellenfeest', label: 'Vrijgezellenfeest' },
  { value: 'bedrijfsyoga', label: 'Bedrijfsyoga' },
  { value: 'teamuitje', label: 'Teamuitje' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'event', label: 'Event of samenwerking' },
  { value: 'priveles', label: 'Privéles' },
  { value: 'anders', label: 'Iets anders' },
] as const

export type SessionType = (typeof SESSION_TYPES)[number]['value']

export const SESSION_LOCATIONS = [
  { value: 'studio', label: 'In de studio in Rotterdam Nesselande' },
  { value: 'op-locatie', label: 'Op een locatie naar keuze' },
  { value: 'onbekend', label: 'Weet ik nog niet' },
] as const

export type SessionLocation = (typeof SESSION_LOCATIONS)[number]['value']

export interface SessionRequest {
  type: SessionType
  name: string
  email: string
  phone: string
  date: string
  participants: string
  location: SessionLocation
  place: string
  message: string
}

export function sessionTypeLabel(type: SessionType): string {
  return SESSION_TYPES.find((t) => t.value === type)!.label
}

export function sessionLocationLabel(location: SessionLocation): string {
  return SESSION_LOCATIONS.find((l) => l.value === location)!.label
}

export function isSessionType(value: unknown): value is SessionType {
  return SESSION_TYPES.some((t) => t.value === value)
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

/** Checks a submitted request; returns the cleaned request, or the Dutch reason it cannot be sent. */
export function parseSessionRequest(input: unknown): { request: SessionRequest } | { error: string } {
  const data = (input ?? {}) as Record<string, unknown>
  const type = data.type
  const location = SESSION_LOCATIONS.some((l) => l.value === data.location) ? (data.location as SessionLocation) : 'onbekend'
  const request = {
    name: text(data.name, 200),
    email: text(data.email, 200),
    phone: text(data.phone, 50),
    date: text(data.date, 100),
    participants: text(data.participants, 50),
    location,
    place: location === 'op-locatie' ? text(data.place, 200) : '',
    message: text(data.message, 5000),
  }

  if (!isSessionType(type)) return { error: 'Kies waarvoor je een sessie wilt aanvragen' }
  if (!request.name) return { error: 'Vul je naam in' }
  if (!EMAIL_PATTERN.test(request.email)) return { error: 'Vul een geldig e-mailadres in' }
  return { request: { type, ...request } }
}
