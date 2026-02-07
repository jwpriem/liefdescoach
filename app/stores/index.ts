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

interface Credit {
    $id: string;
    studentId: string;
    bookingId: string | null;
    type: string;
    validFrom: string;
    validTo: string;
    createdAt: string;
    usedAt: string | null;
    lesson?: {
        $id: string;
        date: string;
        type: string;
        teacher: string;
    } | null;
}

interface CreditSummary {
    available: number;
    used: number;
    expired: number;
    total: number;
}

interface State {
    loggedInUser: User | null;
    students: User[];
    lessons: Lesson[];
    myBookings: Booking[];
    myCredits: Credit[];
    myCreditSummary: CreditSummary | null;
    studentCreditSummary: Record<string, number>;
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
        myCredits: [],
        myCreditSummary: null,
        studentCreditSummary: {},
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
        async sendOtp(email: string) {
            await this.fetchWrapper(async () => {
                await $fetch('/api/auth/send-otp', {
                    method: 'POST',
                    body: { email }
                })
            })
        },
        async verifyOtp(email: string, otp: string) {
            const sessionOk = await this.fetchWrapper(async () => {
                // Server validates OTP and returns a login token
                const res = await $fetch('/api/auth/verify-otp', {
                    method: 'POST',
                    body: { email, code: otp }
                })

                // Let the client SDK create the session so it properly
                // manages cookies and localStorage (cookieFallback)
                const { account } = useAppwrite()
                await account.createSession(res.userId, res.secret)
            })

            if (!sessionOk) return

            await this.getUser()
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
                        this.fetchCredits(),
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
                await this.fetchStudentCreditSummary();
            }
        },

        async fetchStudentCreditSummary() {
            if (this.isAdmin) {
                const res = await $fetch('/api/credits/summary');
                this.studentCreditSummary = res.summary;
            }
        },

        async fetchBookings() {
            const bookings = await $fetch('/api/bookings', {
                method: 'post',
                body: { userId: this.loggedInUser.$id }
            })
            // Filter out bookings with deleted/unresolved lessons
            this.myBookings = bookings.rows.filter((b: any) => b.lessons && typeof b.lessons === 'object')
        },

        async fetchCredits(studentId?: string) {
            const res = await $fetch('/api/credits/history', {
                method: 'post',
                body: { studentId: studentId || this.loggedInUser?.$id }
            })
            this.myCredits = res.credits
            this.myCreditSummary = {
                available: res.available,
                used: res.credits.filter((c: any) => !!c.bookingId).length,
                expired: res.credits.filter((c: any) => !c.bookingId && new Date(c.validTo) <= new Date()).length,
                total: res.credits.length,
            }
        },

        async addCredits(studentId: string, type: string) {
            await this.fetchWrapper(async () => {
                await $fetch('/api/credits/add', {
                    method: 'POST',
                    body: { studentId, type }
                })
                await this.getUser()
            })
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

                const res = await databases.createDocument(
                    useRuntimeConfig().public.database,
                    'students',
                    user.$id,
                    { email: user.email, name: user.name }
                );

                await this.getUser(); // Refresh user details

                // Grant 1 welcome credit for the first booking
                await $fetch('/api/credits/welcome', {
                    method: 'POST',
                    body: { studentId: user.$id }
                })
                await this.fetchCredits()

                await $fetch('/api/mail/send', {
                    method: 'POST',
                    body: {
                        type: 'new-user',
                        data: {
                            name: user.name,
                            email: user.email,
                            phone: user.phone || '',
                            date: new Date(user.$createdAt).toLocaleDateString('nl-NL'),
                        }
                    }
                })
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
                this.myCredits = [];
                this.myCreditSummary = null;
                this.studentCreditSummary = {};
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
            const user = await this.getOnBehalfOrUser()

            const emailData = {
                lessonId,
                email: user.email,
                name: user.name,
            }

            try {
                await $fetch(`/api/${type}`, {
                    method: 'POST',
                    body: emailData
                })
            } catch (e) {
                // Email failure should not block the user — the booking/cancellation already succeeded
                console.error('sendEmail failed:', type, e)
            }
        },

        async getOnBehalfOrUser() {
            return this.onBehalfOf != null ? this.onBehalfOf : this.loggedInUser
        },

        async clearOnBehalf() {
            await Promise.all([this.setOnBehalfOf(null), this.fetchLessons(), this.fetchStudents(), this.fetchBookings()]);
        }
    },

    getters: {
        isAdmin: (state) => state.loggedInUser?.labels.includes('admin') || false,
        availableCredits: (state) => state.myCreditSummary?.available ?? 0,
    }
})