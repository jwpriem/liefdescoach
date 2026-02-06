import { defineStore } from 'pinia'

export const MAX_LESSON_CAPACITY = 9

interface UserPrefs {
    credits?: string;
    archive?: boolean;
    [key: string]: any;
}

interface User {
    $id?: string;
    email?: string;
    name?: string;
    phone?: string;
    prefs?: UserPrefs;
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
    teacher?: string;
    bookings: Booking[];
}

interface Booking {
    $id: string;
    lessons: Lesson;
    students: Student;
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
                // Check if the server returned a Dutch statusMessage from our API routes
                const serverMessage = e?.data?.statusMessage ?? e?.statusMessage
                let friendly = 'Er is iets verkeerd gegaan.'
                if (serverMessage && /[a-zA-Z]/.test(serverMessage) && !/fetch/i.test(serverMessage)) {
                    friendly = serverMessage
                } else if (code === 409 || /already exists/i.test(msg)) {
                    friendly = 'Emailadres is al in gebruik, probeer in te loggen'
                } else if (/Invalid credentials/i.test(msg)) {
                    friendly = 'Verkeerde e-mailadres of wachtwoord. Probeer opnieuw.'
                } else if (/password.*at least.*8/i.test(msg)) {
                    friendly = 'Wachtwoord moet minimaal 8 tekens zijn'
                } else if (/Password must be between 8 and 256 characters long/i.test(msg)) {
                    friendly = 'Wachtwoord moet minimaal 8 tekens zijn'
                } else if (code === 429 || /too many requests/i.test(msg)) {
                    friendly = 'Te veel pogingen, probeer later opnieuw.'
                } else if (code === 402) {
                    friendly = 'Onvoldoende credits'
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

                // First, verify the user is authenticated with Appwrite
                try {
                    const user = await account.get()
                    this.loggedInUser = user
                } catch (e: any) {
                    const code = e?.code ?? e?.response?.status
                    const msg = e?.message ?? String(e)

                    // Treat "no session" as logged-out state, not an error banner
                    if (code === 401 || /missing scope \(account\)/i.test(msg)) {
                        this.loggedInUser = null
                        return
                    }
                    throw e
                }

                // Sync the Appwrite session to a cookie for server-side auth.
                // The client SDK stores the session hash in localStorage (cookieFallback),
                // not in session.secret (which is only populated with an API key).
                try {
                    const projectId = useRuntimeConfig().public.project
                    const cookieFallback = JSON.parse(window.localStorage.getItem('cookieFallback') ?? '{}')
                    const sessionHash = cookieFallback?.[`a_session_${projectId}`]
                    if (sessionHash) {
                        document.cookie = `a_session_${projectId}=${sessionHash}; path=/; max-age=31536000; SameSite=Lax`
                    }
                } catch {
                    // localStorage not available or parse error
                }

                // Fetch protected resources (separate from auth check above)
                if (this.loggedInUser) {
                    await Promise.all([
                        this.fetchLessons(),
                        this.fetchStudents(),
                        this.fetchBookings(),
                    ])
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
                await account.createEmailPasswordSession(email, password);

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

                // Clear the session cookie we set for server-side auth
                document.cookie = `a_session_${useRuntimeConfig().public.project}=; path=/; max-age=0`

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
                const onBehalfOfUser = this.onBehalfOf
                const isOnBehalf = onBehalfOfUser && onBehalfOfUser.$id !== this.loggedInUser?.$id

                // Server handles: validation, credit check, availability, booking creation, credit deduction
                await $fetch('/api/handleBooking', {
                    method: 'POST',
                    body: {
                        lessonId: lesson.$id,
                        onBehalfOfUserId: isOnBehalf ? onBehalfOfUser.$id : null
                    }
                })

                isOnBehalf ? await this.clearOnBehalf() : await this.getUser()
                await this.sendEmail('sendBookingConfirmation', lesson.$id)
            });
        },

        async cancelBooking(booking: Booking) {
            await this.fetchWrapper(async () => {
                const onBehalfOfUser = this.onBehalfOf
                const isOnBehalf = onBehalfOfUser && onBehalfOfUser.$id !== this.loggedInUser?.$id

                // Server handles: authorization, cancellation period, booking deletion, credit refund
                const result = await $fetch('/api/cancelBooking', {
                    method: 'POST',
                    body: {
                        bookingId: booking.$id,
                        onBehalfOfUserId: isOnBehalf ? onBehalfOfUser.$id : null
                    }
                })

                isOnBehalf ? await this.clearOnBehalf() : await this.getUser()
                await this.sendEmail('sendBookingCancellation', result.lessonId)
            });
        },

        async sendEmail(type: string, lessonId: string) {
            const { tablesDB } = useAppwrite();
            const { $rav } = useNuxtApp();

            const user = await this.getOnBehalfOrUser()

            const lessonsResponse = await tablesDB.getRow(
                useRuntimeConfig().public.database,
                'lessons',
                lessonId,
                ['*', 'bookings.*', 'bookings.students.*']
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
                lessontype: $rav.getLessonTitle(lessonsResponse),
                lessondate: $rav.formatDateInDutch(lessonsResponse.date, true),
                spots: MAX_LESSON_CAPACITY - lessonsResponse.bookings.length,
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

            await mail.send({
                config: 0,
                from: 'Yoga Ravennah <info@ravennah.com>',
                subject: subject,
                text: message
            })
        }
    },

    getters: {
        isAdmin: (state) => state.loggedInUser?.labels.includes('admin') || false,
    }
})