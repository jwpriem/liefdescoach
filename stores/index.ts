import {defineStore} from 'pinia'

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
        async fetchWrapper(callback: Function) {
            this.isLoading = true;
            try {
                await callback();
            } catch (error) {
                console.log(error)

                // Define an object mapping specific error messages to user-friendly messages
                const errorMessages = {
                    "AppwriteException: A user with the same id, email, or phone already exists in this project.": 'Emailadres is al in gebruik, probeer in te loggen',
                    "AppwriteException: Invalid `password` param: Password must be at least 8 characters and should not be one of the commonly used password.": 'Wachtwoord moet minimaal 8 character zijn',
                    "AppwriteException: Invalid credentials. Please check the email and password.": 'Verkeerde emailadres of wachtwoord. Probeer opnieuw.',

                };
                const errorOrFallback = errorMessages[error] || 'Er is iets verkeerd gegaan.'
                // Default error message for unhandled exceptions
                this.errorMessage = error == "AppwriteException: User (role: guests) missing scope (account)" ?  '' : errorOrFallback;
            } finally {
                this.isLoading = false;
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
          await this.fetchWrapper(async() => {
              const {account} = useAppwrite();
              await account.createEmailSession(email, password);
              await this.getUser()

              // Unarchive on login if archived
              if (this.loggedInUser.prefs['archive'] == true) {
                  await $fetch('/api/updatePrefs', {
                      method: 'post',
                      body: {
                          userId: this.loggedInUser.$id,
                          prefs: {
                              archive: false,
                          },
                      },
                  });
              }
          })
        },
        async getUser() {
            await this.fetchWrapper(async () => {
                const {account} = useAppwrite();
                this.loggedInUser = await account.get()

                await Promise.all([this.fetchLessons(), this.fetchStudents(), this.fetchBookings()]);
            });
        },
        async fetchLessons() {
            if (this.isAdmin) {
                const lessons = await $fetch('/api/lessonsWithBookings')
                this.lessons = lessons.documents
            } else {
                const lessons = await $fetch('/api/lessons')
                this.lessons = lessons.documents
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
                body: {userId: this.loggedInUser.$id}
            })
            this.myBookings = bookings.documents
        },

        async updateUserDetail(detailType: 'name' | 'email' | 'phone', newValue: string, password: string) {
            await this.fetchWrapper(async () => {
                const {account} = useAppwrite();

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
                const {account} = useAppwrite();
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
                const {res} = await $fetch('/api/updatePrefs', {
                    method: 'POST',
                    body: data
                })
                await this.getUser(); // Refresh user details
            });
        },
        async registerUser(email: string, password: string, name: string, phone: string) {
            await this.fetchWrapper(async () => {
                const {account, databases, ID} = useAppwrite();
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
                    {email: user.email, name: user.name}
                );

                await this.getUser(); // Refresh user details

                const message = `Naam:\\n${user.name}\\n\\nEmail:\\n${user.email}\\n\\nTelefoon:\\n${user.phone}\\n\\nDatum:\\n${$rav.formatDateInDutch(user.$createdAt)}`
                await this.sendSimpleEmail('Nieuwe gebruiker Yoga Ravennah', message)
            });
        },
        async logoutUser() {
            await this.fetchWrapper(async () => {
                const {account} = useAppwrite();

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
                const {account, databases, ID} = useAppwrite();

                const user = await this.getOnBehalfOrUser()
                console.log(user)
                // Register booking
                await databases.createDocument(
                    useRuntimeConfig().public.database,
                    'bookings',
                    ID.unique(),
                    {lessons: lesson.$id, students: user.$id}
                )

                await this.updatePrefs(user, {credits: +user.prefs['credits'] - 1})
                this.onBehalfOf ? await this.clearOnBehalf() : await this.getUser(); // Refresh user details
                await this.sendEmail('sendBookingConfirmation', lesson.$id)
            });
        },

        async cancelBooking(booking: Booking) {
            await this.fetchWrapper(async () => {
                const {databases} = useAppwrite();
                const user = await this.getOnBehalfOrUser()
                // Cancel booking
                await databases.deleteDocument(
                    useRuntimeConfig().public.database,
                    'bookings',
                    booking.$id
                )
                await this.updatePrefs(user, {credits: +user.prefs['credits'] + 1})
                this.onBehalfOf ? await this.clearOnBehalf() : await this.getUser(); // Refresh user details
                await this.sendEmail('sendBookingCancellation', booking.lessons.$id)
            });
        },

        async sendEmail(type: string, lessonId: string) {
            const {databases} = useAppwrite();
            const {$rav} = useNuxtApp();

            const user = await this.getOnBehalfOrUser()

            const lessonsResponse = await databases.getDocument(
                useRuntimeConfig().public.database,
                'lessons',
                lessonId,
            )

            // Bookingsarray for email
            const bookingsArr: any = []
            lessonsResponse.bookings.forEach((x: any) => {
                bookingsArr.unshift({name: x.students.name})
            })

            const emailData = {
                body: null,
                email: user.email,
                new_booking_name: user.name,
                lessontype: lessonsResponse.type == 'peachy bum' ? 'Peachy Bum' : 'Hatha Yoga',
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

    getters: {
        isAdmin: (state) => state.loggedInUser?.labels.includes('admin') || false,
    }
})