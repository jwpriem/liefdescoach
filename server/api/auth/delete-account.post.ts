import { createError } from 'h3'
import { DELETE_ACCOUNT_CONFIRMATION } from '../../../shared/account'
import { lessonTypeLabel } from '../../../shared/lesson'
import { deleteAccount, type DeletedAccount } from '../../utils/accountDeletion'
import { MAIL_FROM, STUDIO_EMAIL } from '../../utils/constants'
import { formatLessonDate } from '../../utils/dates'
import { accountDeletedAdminEmail, accountDeletedEmail } from '../../utils/emailTemplates'

/** Confirms to the member (at the address the account had) and tells the studio. Never throws. */
async function sendDeletionEmails(account: DeletedAccount): Promise<void> {
    const mails = [
        ...(account.email ? [{ to: account.email, ...accountDeletedEmail({ name: account.name }) }] : []),
        {
            to: STUDIO_EMAIL,
            ...accountDeletedAdminEmail({
                name: account.name,
                email: account.email,
                cancelledLessons: account.cancelledLessons.map((lesson) => `${lessonTypeLabel(lesson)} — ${formatLessonDate(lesson.date)}`),
                unusedCredits: account.unusedCredits,
            }),
        },
    ]
    await Promise.allSettled(mails.map(async (mail) => {
        try {
            await smtpTransport.sendMail({ from: MAIL_FROM, to: mail.to, subject: mail.subject, html: mail.html, text: mail.text })
        } catch (err: any) {
            console.error('[DeleteAccount] Email failed:', err?.message ?? err)
        }
    }))
}

/**
 * POST /api/auth/delete-account
 * A member deletes their own account. Only ever acts on the caller; an admin account cannot delete itself.
 */
export default defineEventHandler(async (event) => {
    const user = await requireAuth(event)

    if (user.labels.includes('admin')) {
        throw createError({ statusCode: 403, statusMessage: 'Een beheerdersaccount kan niet worden verwijderd' })
    }

    const body = await readBody(event)
    if (body?.confirmation !== DELETE_ACCOUNT_CONFIRMATION) {
        throw createError({ statusCode: 400, statusMessage: `Typ ${DELETE_ACCOUNT_CONFIRMATION} om te bevestigen` })
    }

    const account = await deleteAccount(user.$id)
    if (!account) {
        throw createError({ statusCode: 404, statusMessage: 'Account niet gevonden' })
    }

    // The session rows are gone with the account; this also clears the website's cookie
    await destroySession(event)

    event.waitUntil(sendDeletionEmails(account))

    return { success: true }
})
