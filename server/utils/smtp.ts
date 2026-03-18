import nodemailer from 'nodemailer'

const isDev = process.env.NODE_ENV !== 'production'

const smtpConfig = {
    host: isDev ? 'sandbox.smtp.mailtrap.io' : 'mail.privateemail.com',
    port: isDev ? 2525 : 465,
    secure: !isDev,
    pool: true,              // Use pooled connections instead of creating new ones each time
    maxConnections: 2,       // Limit concurrent connections (default is 5)
    maxMessages: 50,         // Force connection recycling after 50 messages to prevent socket buffer growth
    socketTimeout: 30_000,   // Close idle sockets after 30s
    auth: {
        user: isDev ? process.env.NUXT_PUBLIC_MAIL_USER_DEV : 'info@ravennah.com',
        pass: isDev ? process.env.NUXT_PUBLIC_MAIL_PASS_DEV : process.env.NUXT_PUBLIC_MAIL_PASS,
    },
}

export const smtpTransport = nodemailer.createTransport(smtpConfig)
