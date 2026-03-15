import { defineStore } from 'pinia'

export const MAX_LESSON_CAPACITY = 9

interface UserPrefs {
    credits?: string;
    archive?: boolean;
    [key: string]: any;
}

export interface User {
    $id?: string;
    email?: string;
    name?: string;
    phone?: string;
    dateOfBirth?: string;
    prefs?: UserPrefs;
    credits?: number;
    debits?: number;
    labels?: string[];
    registration?: string;
    emailVerification?: boolean;
    health?: {
        $id?: string;
        injury?: string;
        pregnancy?: boolean;
        dueDate?: string;
    } | null;
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
                const code = e?.code ?? e?.response?.status ?? e?.statusCode
                const msg = e?.message ?? String(e)

                if (opts.ignore401 && code === 401) {
                    return false
                }

                // Friendly messages
                const serverMessage = e?.data?.statusMessage ?? e?.statusMessage
                let friendly = 'Er is iets verkeerd gegaan.'
                if (serverMessage && /[a-zA-Z]/.test(serverMessage) && !/fetch/i.test(serverMessage)) {
                    friendly = serverMessage
                } else if (code === 409 || /already exists/i.test(msg)) {
                    friendly = 'Emailadres is al in gebruik, probeer in te loggen'
                } else if (/Invalid credentials/i.test(msg) || /Verkeerde/i.test(msg)) {
                    friendly = 'Verkeerde e-mailadres of wachtwoord. Probeer opnieuw.'
                } else if (/password.*at least.*8/i.test(msg) || /minimaal 8/i.test(msg)) {
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
                await $fetch('/api/auth/login', {
                    method: 'POST',
                    body: { email, password }
                })
            })

            if (!sessionOk) return

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
                await $fetch('/api/auth/verify-otp', {
                    method: 'POST',
                    body: { email, code: otp }
                })
            })

            if (!sessionOk) return

            await this.getUser()
        },
        async requestEmailVerification() {
            await this.fetchWrapper(async () => {
                await $fetch('/api/auth/request-verification', {
                    method: 'POST'
                })
            })
        },
        async verifyEmail(token: string) {
            await this.fetchWrapper(async () => {
                await $fetch('/api/auth/verify-email', {
                    method: 'POST',
                    body: { token }
                })
                await this.getUser()
            })
        },

        async getUser() {
            await this.fetchWrapper(async () => {
                try {
                    const user = await $fetch('/api/auth/me')
                    this.loggedInUser = user
                } catch (e: any) {
                    const code = e?.statusCode ?? e?.data?.statusCode
                    if (code === 401) {
                        this.loggedInUser = null
                        return
                    }
                    throw e
                }

                // Fetch health and profile data
                if (this.loggedInUser) {
                    try {
                        const { health, dateOfBirth, phone } = await $fetch('/api/health/me')
                        this.loggedInUser = { ...this.loggedInUser, health, dateOfBirth, phone }
                    } catch (e) {
                        console.error('Failed to fetch health data', e)
                    }

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
                if (detailType === 'email') {
                    // Email change requires password verification
                    await $fetch('/api/auth/update-profile', {
                        method: 'POST',
                        body: { email: newValue }
                    })
                } else {
                    // Name and phone go through students/update-profile
                    await $fetch('/api/students/update-profile', {
                        method: 'POST',
                        body: { [detailType]: newValue }
                    })
                }

                await this.getUser()
            });
        },

        async updatePasswordUser(password: string, newPassword: string) {
            await this.fetchWrapper(async () => {
                await $fetch('/api/auth/update-password', {
                    method: 'POST',
                    body: { password, newPassword }
                })
                await this.getUser()
            });
        },

        async updatePrefs(user: User, prefs: Object) {
            await this.fetchWrapper(async () => {
                const data = {
                    userId: user.$id,
                    prefs: prefs
                }
                await $fetch('/api/updatePrefs', {
                    method: 'POST',
                    body: data
                })
                await this.getUser()
            });
        },

        async updateHealth(user: User, healthData: any) {
            await this.fetchWrapper(async () => {
                await $fetch('/api/health/update', {
                    method: 'POST',
                    body: {
                        userId: user.$id,
                        ...healthData
                    }
                })
                await this.getUser()
            });
        },
        async registerUser(email: string, password: string, name: string, phone: string, dateOfBirth: string | null = null, injury: string | null = null) {
            await this.fetchWrapper(async () => {
                const res = await $fetch('/api/auth/register', {
                    method: 'POST',
                    body: { email, password, name, phone: phone || null, dateOfBirth }
                })

                await this.getUser()

                // Grant 1 welcome credit for the first booking
                await $fetch('/api/credits/welcome', {
                    method: 'POST',
                    body: { studentId: res.user.$id }
                })
                await this.fetchCredits()

                // Create initial health record if injury was provided
                if (injury) {
                    await $fetch('/api/health/update', {
                        method: 'POST',
                        body: {
                            userId: res.user.$id,
                            injury: injury,
                            pregnancy: false,
                            dueDate: null
                        }
                    })
                    await this.getUser()
                }

                await $fetch('/api/mail/send', {
                    method: 'POST',
                    body: {
                        type: 'new-user',
                        data: {
                            name: res.user.name,
                            email: res.user.email,
                            phone: phone || '',
                            date: new Date().toLocaleDateString('nl-NL'),
                        }
                    }
                })
            });
        },
        async logoutUser() {
            await this.fetchWrapper(async () => {
                await $fetch('/api/auth/logout', { method: 'POST' })

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

        async handleBooking(lesson: Lesson, options: { extraSpot?: boolean } = {}) {
            await this.fetchWrapper(async () => {
                const onBehalfOfUser = this.onBehalfOf
                const isOnBehalf = onBehalfOfUser && onBehalfOfUser.$id !== this.loggedInUser?.$id

                await $fetch('/api/handleBooking', {
                    method: 'POST',
                    body: {
                        lessonId: lesson.$id,
                        onBehalfOfUserId: isOnBehalf ? onBehalfOfUser.$id : null,
                        extraSpot: options.extraSpot === true,
                    }
                })

                await this.sendEmail('sendBookingConfirmation', lesson.$id)
                isOnBehalf ? await this.clearOnBehalf() : await this.getUser()
                if (!isOnBehalf) await this.fetchBookings()
            });
        },

        async cancelBooking(booking: Booking) {
            await this.fetchWrapper(async () => {
                const onBehalfOfUser = this.onBehalfOf
                const isOnBehalf = onBehalfOfUser && onBehalfOfUser.$id !== this.loggedInUser?.$id

                const result = await $fetch('/api/cancelBooking', {
                    method: 'POST',
                    body: {
                        bookingId: booking.$id,
                        onBehalfOfUserId: isOnBehalf ? onBehalfOfUser.$id : null
                    }
                })

                await this.sendEmail('sendBookingCancellation', result.lessonId)
                isOnBehalf ? await this.clearOnBehalf() : await this.getUser()
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
        isAdmin: (state) => state.loggedInUser?.labels?.includes('admin') || false,
        availableCredits: (state) => state.myCreditSummary?.available ?? 0,
    }
})
