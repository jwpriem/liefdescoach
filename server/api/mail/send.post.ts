import { createError } from 'h3'

/**
 * Server-side email API for simple notification emails.
 *
 * Body: { type: string, data: object }
 * Types: 'contact' | 'new-user'
 *
 * Booking/cancellation emails are handled by their own dedicated endpoints
 * (sendBookingConfirmation / SendBookingCancellation) which send 2 emails each.
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body?.type || typeof body.type !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Email type is verplicht' })
    }

    let email: { subject: string; html: string; text: string }
    let to = 'info@ravennah.com'

    switch (body.type) {
        case 'contact':
            email = contactEmail(body.data)
            break
        case 'new-user':
            email = newUserEmail(body.data)
            break
        default:
            throw createError({ statusCode: 400, statusMessage: `Onbekend email type: ${body.type}` })
    }

    await smtpTransport.sendMail({
        from: 'Yoga Ravennah <info@ravennah.com>',
        to,
        subject: email.subject,
        html: email.html,
        text: email.text,
    })

    return { success: true }
})
