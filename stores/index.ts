import { defineStore } from 'pinia'

// Define interfaces for your state and other types you will use
interface User {
    $id?: string;
    email?: string;
    name?: string;
    phone?: string;
    prefs?: [];
    credits?: number;
    debits?: number;
    labels?: string[];
    registration?: string;
}

interface Student {
    $id?: string;
    email?: string;
    name?: string;
}

interface Lesson {
    $id: string;
    date: string;
    type: string;
    bookings: Array;
}

interface Booking {
    $id: string;
    lessons: Lesson[];
    students: Student[];
}

interface State {
    loggedInUser: User | null;
    students: User[];
    lessons: Lesson[];
    myBookings: Booking[];
    errorMessage: string | null;
    isLoading: boolean;
    onBehalfOf: User | null;
}

export const useMainStore = defineStore('main', {
    state: (): State => ({
        loggedInUser: null,
        students: [],
        lessons: [],
        myBookings: [],
        errorMessage: null,
        isLoading: false,
        onBehalfOf: null
    }),
    actions: {
        async fetchWrapper(
            callback: () => Promise<void>,
            opts: { ignore401?: boolean } = {}
        ) {
            this.isLoading = true
            this.errorMessage = '' // clear stale

            try {
                await callback()
                return true
            } catch (e: any) {
                console.error(e)
                const code = e?.code ?? e?.response?.status
                const msg = e?.message ?? String(e)

                // Swallow only when:
                //  - caller asked to ignore 401 OR
                //  - it's the "guest missing scope (account)" case
                const isGuestMissingScope = code === 401 && /missing scope \(account\)/i.test(msg)
                if ((opts.ignore401 && code === 401) || isGuestMissingScope) {
                    return false
                }
                console.log(msg)
                // Friendly messages
                let friendly = 'Er is iets verkeerd gegaan.'
                if (code === 409 || /already exists/i.test(msg)) {
                    friendly = 'Emailadres is al in gebruik, probeer in te loggen'
                } else if (/Invalid credentials/i.test(msg)) {
                    friendly = 'Verkeerde e-mailadres of wachtwoord. Probeer opnieuw.'
                } else if (/password.*at least.*8/i.test(msg)) {
                    friendly = 'Wachtwoord moet minimaal 8 tekens zijn'
                } else if (/Password must be between 8 and 256 characters long/i.test(msg)) {
                    friendly = 'Wachtwoord moet minimaal 8 tekens zijn'
                } else if (code === 429 || /too many requests/i.test(msg)) {
                    friendly = 'Te veel pogingen, probeer later opnieuw.'
                }

                this.errorMessage = friendly
                return false
            } finally {
                this.isLoading = false
            }
        },
        async setLoading(value: boolean) {
            this.isLoading = value
        },
        async setError(value: string) {
            this.errorMessage = value
        },
        async setOnBehalfOf(user: User) {
            this.onBehalfOf = user
        },
        async login(email: string, password: string) {
            const sessionOk = await this.fetchWrapper(async () => {
                const { account } = useAppwrite()
                await account.createEmailPasswordSession(email, password) // if this throws, sessionOk=false
            })

            if (!sessionOk) return

            // Only runs when session creation succeeded
            await this.getUser()

            if (this.loggedInUser?.prefs?.['archive'] === true) {
                await $fetch('/api/updatePrefs', {
                    method: 'post',
                    body: {
                        userId: this.loggedInUser.$id,
                        prefs: { archive: false },
                    },
                })
            }
        },
        async getUser() {
            await this.fetchWrapper(async () => {
                const { account } = useAppwrite()

                try {
                    const user = await account.get()
                    this.loggedInUser = user

                    // Only fetch protected resources if we have a session
                    await Promise.all([
                        this.fetchLessons(),
                        this.fetchStudents(),
                        this.fetchBookings(),
                    ])
                } catch (e: any) {
                    const code = e?.code ?? e?.response?.status
                    const msg = e?.message ?? String(e)

                    // Treat "no session" as logged-out state, not an error banner
                    if (code === 401 || /missing scope \(account\)/i.test(msg)) {
                        this.loggedInUser = null
                        return
                    }
                    // Bubble up real errors to fetchWrapper
                    throw e
                }
            }, { ignore401: true })
        },
        async fetchLessons() {
            if (this.isAdmin) {
                const lessons = await $fetch('/api/lessonsWithBookings')
                this.lessons = lessons.rows
            } else {
                const lessons = await $fetch('/api/lessons')
                this.lessons = lessons.rows
            }
        },

        async fetchStudents() {
            if (this.isAdmin) {
                const users = await $fetch('/api/users');
                this.students = users.users;
            }
        },

        async fetchBookings() {
            const bookings = await $fetch('/api/bookings', {
                method: 'post',
                body: { userId: this.loggedInUser.$id }
            })
            this.myBookings = bookings.rows
        },

        async updateUserDetail(detailType: 'name' | 'email' | 'phone', newValue: string, password: string) {
            await this.fetchWrapper(async () => {
                const { account } = useAppwrite();

                if (detailType === 'name') {
                    await account.updateName(newValue, password);
                }

                if (detailType === 'email') {
                    await account.updateEmail(newValue, password);
                }

                if (detailType === 'phone') {
                    await account.updatePhone(newValue, password);
                }

                await this.getUser(); // Refresh user details
            });
        },

        async updatePasswordUser(password: string, newPassword: string) {
            await this.fetchWrapper(async () => {
                const { account } = useAppwrite();
                await account.updatePassword(newPassword, password);
                await this.getUser(); // Refresh user details
            });
        },

        async updatePrefs(user: User, prefs: Object) {
            await this.fetchWrapper(async () => {
                const data = {
                    userId: user.$id,
                    prefs: prefs
                }
                const { res } = await $fetch('/api/updatePrefs', {
                    method: 'POST',
                    body: data
                })
                await this.getUser(); // Refresh user details
            });
        },
        async registerUser(email: string, password: string, name: string, phone: string) {
            await this.fetchWrapper(async () => {
                const { account, databases, ID } = useAppwrite();
                const registration = await account.create(ID.unique(), email, password, name);
                await account.createEmailSession(email, password);

                if (phone) {
                    await this.updateUserDetail('phone', phone, password);
                }

                const user = await account.get();
                await $fetch('/api/updatePrefs', {
                    method: 'post',
                    body: {
                        userId: user.$id,
                        prefs: {
                            credits: '0'
                        }
                    }
                })

                const res = await databases.createDocument(
                    useRuntimeConfig().public.database,
                    'students',
                    user.$id,
                    { email: user.email, name: user.name }
                );

                await this.getUser(); // Refresh user details

                const message = `Naam:\\n${user.name}\\n\\nEmail:\\n${user.email}\\n\\nTelefoon:\\n${user.phone}\\n\\nDatum:\\n${$rav.formatDateInDutch(user.$createdAt)}`
                await this.sendSimpleEmail('Nieuwe gebruiker Yoga Ravennah', message)
            });
        },
        async logoutUser() {
            await this.fetchWrapper(async () => {
                const { account } = useAppwrite();

                await account.deleteSession("current");
                this.loggedInUser = null;
                this.students = [];
                this.lessons = [];
                this.myBookings = [];
                this.errorMessage = null;
                this.isLoading = false;
            });
        },

        async handleBooking(lesson: Lesson) {
            await this.fetchWrapper(async () => {
                const { account, databases, ID } = useAppwrite();

                const user = await this.getOnBehalfOrUser()

                // Register booking
                await databases.createDocument(
                    useRuntimeConfig().public.database,
                    'bookings',
                    ID.unique(),
                    { lessons: lesson.$id, students: user.$id }
                )

                await this.updatePrefs(user, { credits: +user.prefs['credits'] - 1 })
                this.onBehalfOf ? await this.clearOnBehalf() : await this.getUser(); // Refresh user details
                await this.sendEmail('sendBookingConfirmation', lesson.$id)
            });
        },

        async cancelBooking(booking: Booking) {
            await this.fetchWrapper(async () => {
                const { databases } = useAppwrite();
                const user = await this.getOnBehalfOrUser()
                // Cancel booking
                await databases.deleteDocument(
                    useRuntimeConfig().public.database,
                    'bookings',
                    booking.$id
                )

                await this.updatePrefs(user, { credits: +user.prefs['credits'] + 1 })
                this.onBehalfOf ? await this.clearOnBehalf() : await this.getUser(); // Refresh user details
                await this.sendEmail('sendBookingCancellation', booking.lessons.$id)
            });
        },

        async sendEmail(type: string, lessonId: string) {
            const { databases } = useAppwrite();
            const { $rav } = useNuxtApp();

            const user = await this.getOnBehalfOrUser()

            const lessonsResponse = await databases.getDocument(
                useRuntimeConfig().public.database,
                'lessons',
                lessonId,
            )

            // Bookingsarray for email
            const bookingsArr: any = []
            lessonsResponse.bookings.forEach((x: any) => {
                bookingsArr.unshift({ name: x.students.name })
            })

            const emailData = {
                body: null,
                email: user.email,
                new_booking_name: user.name,
                lessontype: $rav.checkLessonType(lessonsResponse.type),
                lessondate: $rav.formatDateInDutch(lessonsResponse.date, true),
                spots: 9 - lessonsResponse.bookings.length,
                bookings: bookingsArr,
                calendar_link_apple: $rav.getCalenderLink('apple', lessonsResponse.date, lessonsResponse.type),
                calendar_link_gmail: $rav.getCalenderLink('gmail', lessonsResponse.date, lessonsResponse.type),
                calendar_link_outlook: $rav.getCalenderLink('outlook', lessonsResponse.date, lessonsResponse.type)
            }

            const isProd = process.env.NODE_ENV == 'production'

            if (isProd) {
                await $fetch(`/api/${type}`, {
                    method: 'POST',
                    body: emailData
                })
            } else {
                console.log(emailData)
            }
        },

        async getOnBehalfOrUser() {
            return this.onBehalfOf != null ? this.onBehalfOf : this.loggedInUser
        },

        async clearOnBehalf() {
            await Promise.all([this.setOnBehalfOf(null), this.fetchLessons(), this.fetchStudents(), this.fetchBookings()]);
        },

        async sendSimpleEmail(subject: string, message: string) {
            const mail = useMail()
            // const toast = useToast()

            await mail.send({
                config: 0,
                from: 'Yoga Ravennah <info@ravennah.com>',
                subject: subject,
                text: message
            })
        }
    },

    async smtpEmailTemplate(subject: string, content: string, name: string) {
        const mail = useMail()

        const template = `
          <!doctype html>
          <html lang="en">
              <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                  <title>${subject}</title>
                      <style media="all" type="text/css">
                  @media all {
                    .btn-primary table td:hover {
                background-color: #ec0867 !important;
              }
            
            .btn-primary a:hover {
                background-color: #ec0867 !important;
                border-color: #ec0867 !important;
              }
            }
            @media only screen and (max-width: 640px) {
              .main p,
              .main td,
              .main span {
                  font-size: 16px !important;
                }
            
              .wrapper {
                  padding: 8px !important;
                }
            
              .content {
                  padding: 0 !important;
                }
            
              .container {
                  padding: 0 !important;
                  padding-top: 8px !important;
                  width: 100% !important;
                }
            
              .main {
                  border-left-width: 0 !important;
                  border-radius: 0 !important;
                  border-right-width: 0 !important;
                }
            
              .btn table {
                  max-width: 100% !important;
                  width: 100% !important;
                }
            
              .btn a {
                  font-size: 16px !important;
                  max-width: 100% !important;
                  width: 100% !important;
                }
              }
            @media all {
              .ExternalClass {
                  width: 100%;
                }
            
              .ExternalClass,
              .ExternalClass p,
              .ExternalClass span,
              .ExternalClass font,
              .ExternalClass td,
              .ExternalClass div {
                  line-height: 100%;
                }
            
              .apple-link a {
                  color: inherit !important;
                  font-family: inherit !important;
                  font-size: inherit !important;
                  font-weight: inherit !important;
                  line-height: inherit !important;
                  text-decoration: none !important;
                }
            
                #MessageViewBody a {
                  color: inherit;
                  text-decoration: none;
                  font-size: inherit;
                  font-family: inherit;
                  font-weight: inherit;
                  line-height: inherit;
                }
              }
              </style>
              </head>
              <body style="font-family: Helvetica, sans-serif; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.3; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; background-color: #f4f5f6; margin: 0; padding: 0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f4f5f6; width: 100%;" width="100%" bgcolor="#f4f5f6">
              <tr>
                  <td style="font-family: Helvetica, sans-serif; font-size: 16px; vertical-align: top;" valign="top">&nbsp;</td>
              <td class="container" style="font-family: Helvetica, sans-serif; font-size: 16px; vertical-align: top; max-width: 600px; padding: 0; padding-top: 24px; width: 600px; margin: 0 auto;" width="600" valign="top">
              <div class="content" style="box-sizing: border-box; display: block; margin: 0 auto; max-width: 600px; padding: 0;">
            
                  <!-- START CENTERED WHITE CONTAINER -->
              <span class="preheader" style="color: transparent; display: none; height: 0; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; visibility: hidden; width: 0;">This is preheader text. Some clients will show this text as a preview.</span>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="main" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background: #ffffff; border: 1px solid #eaebed; border-radius: 16px; width: 100%;" width="100%">
            
                  <!-- START MAIN CONTENT AREA -->
              <tr>
                  <td class="wrapper" style="font-family: Helvetica, sans-serif; font-size: 16px; vertical-align: top; box-sizing: border-box; padding: 24px;" valign="top">
              <p style="font-family: Helvetica, sans-serif; font-size: 16px; font-weight: normal; margin: 0; margin-bottom: 16px;">Hi ${name}</p>
              <p style="font-family: Helvetica, sans-serif; font-size: 16px; font-weight: normal; margin: 0; margin-bottom: 16px;">Sometimes you just want to send a simple HTML email with a simple design and clear call to action. This is it.</p>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn btn-primary" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; box-sizing: border-box; width: 100%; min-width: 100%;" width="100%">
              <tbody>
                  <tr>
                      <td align="left" style="font-family: Helvetica, sans-serif; font-size: 16px; vertical-align: top; padding-bottom: 16px;" valign="top">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: auto;">
              <tbody>
                  <tr>
                      <td style="font-family: Helvetica, sans-serif; font-size: 16px; vertical-align: top; border-radius: 4px; text-align: center; background-color: #0867ec;" valign="top" align="center" bgcolor="#0867ec"> <a href="http://htmlemail.io" target="_blank" style="border: solid 2px #0867ec; border-radius: 4px; box-sizing: border-box; cursor: pointer; display: inline-block; font-size: 16px; font-weight: bold; margin: 0; padding: 12px 24px; text-decoration: none; text-transform: capitalize; background-color: #0867ec; border-color: #0867ec; color: #ffffff;">Call To Action</a> </td>
              </tr>
              </tbody>
              </table>
              </td>
              </tr>
              </tbody>
              </table>
              <p style="font-family: Helvetica, sans-serif; font-size: 16px; font-weight: normal; margin: 0; margin-bottom: 16px;">${content}</p>
              </td>
              </tr>
            
              <!-- END MAIN CONTENT AREA -->
              </table>
            
              <!-- START FOOTER -->
              <div class="footer" style="clear: both; padding-top: 24px; text-align: center; width: 100%;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;" width="100%">
              <tr>
                  <td class="content-block" style="font-family: Helvetica, sans-serif; vertical-align: top; color: #9a9ea6; font-size: 16px; text-align: center;" valign="top" align="center">
              <span class="apple-link" style="color: #9a9ea6; font-size: 16px; text-align: center;">Yoga Ravennah</span>
              </td>
              </tr>
              <tr>
                  </table>
                  </div>
            
                  <!-- END FOOTER -->
            
                  <!-- END CENTERED WHITE CONTAINER --></div>
                  </td>
                  <td style="font-family: Helvetica, sans-serif; font-size: 16px; vertical-align: top;" valign="top">&nbsp;</td>
              </tr>
              </table>
              </body>
              </html>`

        await mail.send({
            config: 0,
            from: 'Yoga Ravennah <info@ravennah.com>',
            subject: subject,
            html: template
        })
    },

    getters: {
        isAdmin: (state) => state.loggedInUser?.labels.includes('admin') || false,
    }
})