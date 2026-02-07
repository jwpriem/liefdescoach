/**
 * Shared HTML email template system for Yoga Ravennah.
 *
 * Light background with emerald green accents. Common header (logo) and footer
 * wrap around type-specific content sections.
 */

const LOGO_URL = 'https://www.ravennah.com/logo.png'
const SITE_URL = 'https://www.ravennah.com'
const BRAND_COLOR = '#059669'  // emerald-600
const BRAND_LIGHT = '#d1fae5'  // emerald-100
const BRAND_DARK = '#065f46'   // emerald-800

// ─── Layout wrapper ──────────────────────────────────────────────────────────

function wrapInLayout(title: string, contentHtml: string): string {
    return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;">
<tr><td align="center" style="padding:32px 16px;">

<!--[if mso]><table width="560" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td><![endif]-->
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:16px;">

<!-- Header -->
<tr>
<td align="center" style="padding:32px 32px 24px 32px;border-bottom:1px solid #e5e7eb;">
  <a href="${SITE_URL}" style="text-decoration:none;">
    <img src="${LOGO_URL}" alt="Yoga Ravennah" width="48" height="48" style="display:block;border:0;width:48px;height:48px;border-radius:8px;" />
  </a>
  <p style="margin:12px 0 0 0;font-size:18px;font-weight:700;color:${BRAND_DARK};letter-spacing:-0.3px;">Yoga Ravennah</p>
</td>
</tr>

<!-- Content -->
<tr>
<td style="padding:32px;">
  ${contentHtml}
</td>
</tr>

<!-- Footer -->
<tr>
<td style="padding:24px 32px 32px 32px;border-top:1px solid #e5e7eb;text-align:center;">
  <p style="margin:0 0 8px 0;font-size:12px;color:#9ca3af;">&copy; ${new Date().getFullYear()} Yoga Ravennah. Alle rechten voorbehouden.</p>
  <p style="margin:0 0 4px 0;font-size:12px;color:#9ca3af;">Emmy van Leersumhof 24a, Rotterdam (Nesselande)</p>
  <p style="margin:0;font-size:12px;">
    <a href="${SITE_URL}" style="color:${BRAND_COLOR};text-decoration:none;">ravennah.com</a>
  </p>
</td>
</tr>

</table>
<!--[if mso]></td></tr></table><![endif]-->

</td></tr>
</table>
</body>
</html>`
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function infoRow(label: string, value: string): string {
    return `<tr>
    <td style="padding:8px 12px;font-size:12px;font-weight:600;color:${BRAND_COLOR};text-transform:uppercase;letter-spacing:0.5px;vertical-align:top;width:120px;">${label}</td>
    <td style="padding:8px 12px;font-size:14px;color:#374151;">${value}</td>
  </tr>`
}

function infoTable(rows: string): string {
    return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:12px;margin:20px 0;">
    ${rows}
  </table>`
}

function heading(text: string): string {
    return `<h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#111827;text-align:center;">${text}</h1>`
}

function subtext(text: string): string {
    return `<p style="margin:0 0 20px 0;font-size:14px;color:#6b7280;text-align:center;">${text}</p>`
}

function primaryButton(label: string, href: string): string {
    return `<table cellpadding="0" cellspacing="0" border="0" style="margin:24px auto 0 auto;">
    <tr><td align="center" style="background-color:${BRAND_COLOR};border-radius:8px;">
      <a href="${href}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">${label}</a>
    </td></tr>
  </table>`
}

function participantList(bookings: { name: string }[]): string {
    if (!bookings.length) {
        return '<p style="font-size:14px;color:#9ca3af;margin:0;">Geen deelnemers</p>'
    }
    const items = bookings.map(b => `<li style="font-size:14px;color:#374151;padding:2px 0;">${b.name}</li>`).join('')
    return `<ul style="margin:0;padding-left:20px;">${items}</ul>`
}

// ─── OTP ─────────────────────────────────────────────────────────────────────

export function otpEmail(code: string): { subject: string; html: string; text: string } {
    const content = `
    ${heading('Je inlogcode')}
    ${subtext('Gebruik de onderstaande code om in te loggen op je account.')}
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 20px auto;">
      <tr><td style="background-color:${BRAND_LIGHT};border:2px solid ${BRAND_COLOR};border-radius:12px;padding:16px 32px;text-align:center;">
        <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:${BRAND_DARK};">${code}</span>
      </td></tr>
    </table>
    <p style="font-size:13px;color:#9ca3af;text-align:center;">Deze code is 10 minuten geldig.</p>
    <p style="font-size:13px;color:#9ca3af;text-align:center;">Heb je deze code niet aangevraagd? Dan kun je dit bericht negeren.</p>`

    return {
        subject: 'Je inlogcode voor Yoga Ravennah',
        html: wrapInLayout('Inlogcode', content),
        text: `Je inlogcode is: ${code}\n\nDeze code is 10 minuten geldig.\n\nHeb je deze code niet aangevraagd? Dan kun je dit bericht negeren.`,
    }
}

// ─── Booking: email to STUDENT ───────────────────────────────────────────────

export function bookingStudentEmail(data: {
    name: string
    lessonType: string
    lessonDate: string
    calendarLinks: { apple: string; google: string; outlook: string }
}): { subject: string; html: string; text: string } {
    const content = `
    ${heading('Je les is geboekt!')}
    ${subtext(`Hoi ${data.name}, bedankt voor je boeking. We kijken ernaar uit je te zien!`)}
    ${infoTable(
        infoRow('Les', data.lessonType) +
        infoRow('Datum', data.lessonDate)
    )}
    <p style="font-size:14px;font-weight:600;color:#374151;margin:20px 0 8px 0;">Zet de les in je agenda:</p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
      <tr>
        <td style="padding:0 6px;"><a href="${data.calendarLinks.apple}" style="display:inline-block;padding:8px 16px;font-size:13px;color:${BRAND_COLOR};border:1px solid #e5e7eb;border-radius:8px;text-decoration:none;">Apple</a></td>
        <td style="padding:0 6px;"><a href="${data.calendarLinks.google}" style="display:inline-block;padding:8px 16px;font-size:13px;color:${BRAND_COLOR};border:1px solid #e5e7eb;border-radius:8px;text-decoration:none;">Google</a></td>
        <td style="padding:0 6px;"><a href="${data.calendarLinks.outlook}" style="display:inline-block;padding:8px 16px;font-size:13px;color:${BRAND_COLOR};border:1px solid #e5e7eb;border-radius:8px;text-decoration:none;">Outlook</a></td>
      </tr>
    </table>
    ${primaryButton('Bekijk mijn boekingen', SITE_URL + '/account')}
    <p style="font-size:13px;color:#9ca3af;text-align:center;margin-top:24px;">Tot op de mat! Namaste.</p>`

    return {
        subject: 'Bevestiging: je les is geboekt!',
        html: wrapInLayout('Boekingsbevestiging', content),
        text: `Hoi ${data.name},\n\nBedankt voor je boeking! We kijken ernaar uit je te zien.\n\nLes: ${data.lessonType}\nDatum: ${data.lessonDate}\n\nTot op de mat! Namaste.\nYoga Ravennah`,
    }
}

// ─── Booking: email to ADMIN (info@ravennah.com) ─────────────────────────────

export function bookingAdminEmail(data: {
    name: string
    email: string
    lessonType: string
    lessonDate: string
    spots: number
    bookings: { name: string }[]
}): { subject: string; html: string; text: string } {
    const content = `
    ${heading('Nieuwe boeking')}
    ${subtext(`${data.name} heeft een les geboekt.`)}
    ${infoTable(
        infoRow('Leerling', data.name) +
        infoRow('E-mail', data.email) +
        infoRow('Les', data.lessonType) +
        infoRow('Datum', data.lessonDate) +
        infoRow('Plekken over', String(data.spots))
    )}
    <p style="font-size:14px;font-weight:600;color:#374151;margin:20px 0 8px 0;">Alle deelnemers:</p>
    ${participantList(data.bookings)}`

    const bookingNames = data.bookings.map(b => b.name).join(', ') || 'Geen'

    return {
        subject: 'Nieuwe boeking Yoga Ravennah',
        html: wrapInLayout('Nieuwe boeking', content),
        text: `Nieuwe boeking\n\nLeerling: ${data.name}\nE-mail: ${data.email}\nLes: ${data.lessonType}\nDatum: ${data.lessonDate}\nPlekken over: ${data.spots}\n\nAlle deelnemers: ${bookingNames}`,
    }
}

// ─── Cancellation: email to STUDENT ──────────────────────────────────────────

export function cancellationStudentEmail(data: {
    name: string
    lessonType: string
    lessonDate: string
}): { subject: string; html: string; text: string } {
    const content = `
    ${heading('Je les is geannuleerd')}
    ${subtext(`Hoi ${data.name}, jammer dat je niet kunt komen.`)}
    ${infoTable(
        infoRow('Les', data.lessonType) +
        infoRow('Datum', data.lessonDate)
    )}
    <p style="font-size:14px;color:#374151;text-align:center;margin:20px 0;">Je credit is teruggestort op je account. Je kunt deze gebruiken om een andere les te boeken.</p>
    ${primaryButton('Bekijk het lesrooster', SITE_URL + '/lessen')}
    <p style="font-size:13px;color:#9ca3af;text-align:center;margin-top:24px;">We hopen je snel weer te zien!</p>`

    return {
        subject: 'Annulering: je les is geannuleerd',
        html: wrapInLayout('Annulering', content),
        text: `Hoi ${data.name},\n\nJammer dat je niet kunt komen.\n\nLes: ${data.lessonType}\nDatum: ${data.lessonDate}\n\nJe credit is teruggestort op je account. Je kunt deze gebruiken om een andere les te boeken.\n\nWe hopen je snel weer te zien!\nYoga Ravennah`,
    }
}

// ─── Cancellation: email to ADMIN (info@ravennah.com) ────────────────────────

export function cancellationAdminEmail(data: {
    name: string
    email: string
    lessonType: string
    lessonDate: string
    spots: number
    bookings: { name: string }[]
}): { subject: string; html: string; text: string } {
    const content = `
    ${heading('Annulering')}
    ${subtext(`${data.name} heeft een les geannuleerd.`)}
    ${infoTable(
        infoRow('Leerling', data.name) +
        infoRow('E-mail', data.email) +
        infoRow('Les', data.lessonType) +
        infoRow('Datum', data.lessonDate) +
        infoRow('Plekken over', String(data.spots))
    )}
    <p style="font-size:14px;font-weight:600;color:#374151;margin:20px 0 8px 0;">Resterende deelnemers:</p>
    ${participantList(data.bookings)}`

    const bookingNames = data.bookings.map(b => b.name).join(', ') || 'Geen'

    return {
        subject: 'Annulering Yoga Ravennah',
        html: wrapInLayout('Annulering', content),
        text: `Annulering\n\nLeerling: ${data.name}\nE-mail: ${data.email}\nLes: ${data.lessonType}\nDatum: ${data.lessonDate}\nPlekken over: ${data.spots}\n\nResterende deelnemers: ${bookingNames}`,
    }
}

// ─── New user (to admin) ─────────────────────────────────────────────────────

export function newUserEmail(data: {
    name: string
    email: string
    phone: string
    date: string
}): { subject: string; html: string; text: string } {
    const content = `
    ${heading('Nieuwe gebruiker')}
    ${subtext('Er heeft zich een nieuwe gebruiker geregistreerd.')}
    ${infoTable(
        infoRow('Naam', data.name) +
        infoRow('E-mail', data.email) +
        infoRow('Telefoon', data.phone || 'Niet opgegeven') +
        infoRow('Datum', data.date)
    )}
    ${primaryButton('Bekijk gebruikers', SITE_URL + '/account')}`

    return {
        subject: 'Nieuwe gebruiker Yoga Ravennah',
        html: wrapInLayout('Nieuwe gebruiker', content),
        text: `Nieuwe gebruiker\n\nNaam: ${data.name}\nE-mail: ${data.email}\nTelefoon: ${data.phone || 'Niet opgegeven'}\nDatum: ${data.date}`,
    }
}

// ─── Contact form (to admin) ─────────────────────────────────────────────────

export function contactEmail(data: {
    name: string
    email: string
    message: string
}): { subject: string; html: string; text: string } {
    const content = `
    ${heading('Nieuw contactbericht')}
    ${subtext(`Van ${data.name} (${data.email})`)}
    ${infoTable(
        infoRow('Naam', data.name) +
        infoRow('E-mail', data.email)
    )}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr><td style="padding:16px;background-color:#f9fafb;border-radius:12px;border:1px solid #e5e7eb;">
        <p style="font-size:12px;font-weight:600;color:${BRAND_COLOR};text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px 0;">Bericht</p>
        <p style="font-size:14px;color:#374151;margin:0;white-space:pre-line;">${data.message}</p>
      </td></tr>
    </table>`

    return {
        subject: 'Contactformulier Yoga Ravennah',
        html: wrapInLayout('Contactformulier', content),
        text: `Contactformulier\n\nNaam: ${data.name}\nE-mail: ${data.email}\n\nBericht:\n${data.message}`,
    }
}
