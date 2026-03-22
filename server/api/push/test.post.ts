import { sendPushToStudent } from '../../utils/push'

export default defineEventHandler(async (event) => {
    const user = await requireAdmin(event)

    const sent = await sendPushToStudent(user.$id, {
        title: 'Test notificatie',
        body: 'Push notificaties werken correct op dit apparaat.',
        url: '/account',
    })

    return { sent }
})
