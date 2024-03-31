import { ref } from 'vue';
import { ServerClient, sendEmailWithTemplate } from 'postmark';
import { useRuntimeConfig } from '#imports';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const client = new ServerClient(config.postmark)

    const content = await readBody(event)
    const email = client.sendEmailWithTemplate({
        "From": "info@ravennah.com",
        "To": "info@ravennah.com",
        "TemplateAlias": "lesson-cancel",
        "TemplateModel": content
    })
    console.log(email)
    setResponseStatus(event, 202)
})