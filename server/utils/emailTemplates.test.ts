import { describe, expect, it } from 'vitest'
import { accountDeletedAdminEmail, accountDeletedEmail } from './emailTemplates'

describe('accountDeletedEmail', () => {
  const mail = accountDeletedEmail({ name: 'Bea <b>' })

  it('confirms the deletion to the member', () => {
    expect(mail.subject).toBe('Je account is verwijderd')
    expect(mail.text).toContain('Hoi Bea <b>,')
    expect(mail.text).toContain('Je persoonsgegevens zijn gewist en je komende boekingen zijn geannuleerd.')
    expect(mail.text).toContain('info@ravennah.com')
  })

  it('escapes the name in the HTML version', () => {
    expect(mail.html).toContain('Bea &lt;b&gt;')
    expect(mail.html).not.toContain('Bea <b>')
  })
})

describe('accountDeletedAdminEmail', () => {
  it('tells the studio who left, which lessons were freed and how many credits were unused', () => {
    const mail = accountDeletedAdminEmail({
      name: 'Bea de Vries',
      email: 'bea@example.test',
      cancelledLessons: ['Hatha Yoga — zondag 6 januari van 9.45 tot 10.45 uur'],
      unusedCredits: 3,
    })

    expect(mail.subject).toBe('Account verwijderd: Bea de Vries')
    expect(mail.text).toContain('Leerling: Bea de Vries')
    expect(mail.text).toContain('E-mail: bea@example.test')
    expect(mail.text).toContain('Ongebruikte credits: 3')
    expect(mail.text).toContain('Hatha Yoga — zondag 6 januari van 9.45 tot 10.45 uur')
  })

  it('says so when there was nothing to cancel and no email address', () => {
    const mail = accountDeletedAdminEmail({ name: 'Walk-in', email: null, cancelledLessons: [], unusedCredits: 0 })

    expect(mail.text).toContain('E-mail: onbekend')
    expect(mail.text).toContain('Geannuleerde lessen: geen')
  })
})
