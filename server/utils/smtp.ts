import nodemailer from 'nodemailer'

const isDev = process.env.NODE_ENV !== 'production'

// Create transport with lazy evaluation of runtime config to ensure it's available
// during request processing.
let _transport: any = null

function getTransport() {
    if (_transport) return _transport

    const config = useRuntimeConfig()

    const smtpConfig = {
        host: isDev ? 'sandbox.smtp.mailtrap.io' : 'mail.privateemail.com',
        port: isDev ? 2525 : 465,
        secure: !isDev,
        pool: true,              // Use pooled connections instead of creating new ones each time
        maxConnections: 2,       // Limit concurrent connections (default is 5)
        maxMessages: 50,         // Force connection recycling after 50 messages to prevent socket buffer growth
        socketTimeout: 30_000,   // Close idle sockets after 30s
        auth: {
            user: isDev ? (process.env.NUXT_PUBLIC_MAIL_USER_DEV || 'dev@example.com') : 'info@ravennah.com',
            pass: isDev ? config.mailPassDev : config.mailPass,
        },
    }

    _transport = nodemailer.createTransport(smtpConfig)
    return _transport
}

// Proxy the transport to allow it to be used as if it were the original object
// while deferring initialization until the first use of any of its methods.
export const smtpTransport = new Proxy({} as any, {
    get(target, prop) {
        return getTransport()[prop]
    }
})
