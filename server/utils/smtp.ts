import nodemailer from 'nodemailer'

const isDev = process.env.NODE_ENV !== 'production'

const smtpConfig = {
    host: isDev ? 'sandbox.smtp.mailtrap.io' : 'mail.privateemail.com',
    port: isDev ? 2525 : 465,
    secure: !isDev,
    auth: {
        user: isDev ? process.env.NUXT_PUBLIC_MAIL_USER_DEV : 'info@ravennah.com',
        pass: isDev ? process.env.NUXT_PUBLIC_MAIL_PASS_DEV : process.env.NUXT_PUBLIC_MAIL_PASS,
    },
}

export const smtpTransport = nodemailer.createTransport(smtpConfig)
