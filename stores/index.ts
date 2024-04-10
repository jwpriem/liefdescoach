import { defineStore } from 'pinia'
import { Query } from 'appwrite';
import {tryCatch} from "standard-as-callback/built/utils";

// Define interfaces for your state and other types you will use
interface User {
    $id?: string;
    email?: string;
    name?: string;
    phone?: string;
    preferences?: [];
    credits?: number;
    debits?: number;
    labels?: string[];
    registration?: string;
    isAdmin?: boolean;
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
    // Add more lesson properties as needed
}

interface Booking {
    $id: string;
    lessons: Lesson[];
    students: Student[];
}

interface State {
    loggedInUser: User | null;
    isAdmin: boolean;
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
        isAdmin: false,
        students: [],
        lessons: [],
        myBookings: [],
        errorMessage: null,
        isLoading: false,
        onBehalfOf: null
    }),
    actions: {
        async setLoading(value: boolean) {
            this.isLoading = value
        },
        async setError(value: string) {
            this.errorMessage = value
        },
        async setOnBehalfOf(user: User) {
            this.onBehalfOf = user
        },
        async getUser(){
            try {
                const { account } = useAppwrite();
                const user = await account.get()
                this.loggedInUser = user
                this.isAdmin = this.loggedInUser.labels.includes('admin')

                const bookings = await $fetch('/api/bookings', {
                    method: 'post',
                    body: { userId: this.loggedInUser.$id }
                })
                this.myBookings = bookings.documents

                if(this.isAdmin) {
                    const lessons = await $fetch('/api/lessonsWithBookings')
                    this.lessons = lessons.documents

                    const users = await $fetch('/api/users')
                    this.students = users.users
                }
            } catch(error) {

            }
        },
        async phoneUpdate(phone: string, password: string) {
            try {
                const { account, databases, ID } = useAppwrite();
                this.isLoading = true
                
                await account.updatePhone(phone, password)
                
                this.isLoading = false
                await this.getUser();
            } catch(error) {
                this.isLoading = false
            }
        },
        async emailUpdate(email: string, password: string) {
            try {
                const { account, databases, ID } = useAppwrite();
                this.isLoading = true
                
                await account.updateEmail(email, password)

                this.isLoading = false
                await this.getUser()
                
            } catch(error) {
                this.isLoading = false
            }
        },
        async nameUpdate(name: string, password: string) {
            try {
                const { account, databases, ID } = useAppwrite();
                this.isLoading = true
                
                await account.updateName(name, password)
                
                this.isLoading = false
                await this.getUser()
                
            } catch(error) {
                this.isLoading = false
            }
        },
        async updatePasswordUser(password: string, newPassword: string) {
            try {
                const { account, databases, ID } = useAppwrite();
                
                this.isLoading = true

                await account.updatePassword(newPassword, password)

                this.isLoading = false
                await this.getUser()

            } catch(error) {
                this.isLoading = false
            }
        },
        async updatePrefs(user: User, prefs: Object) {
            this.loading = true

            try {
                const data = {
                    userId: user.$id,
                    prefs: prefs
                }
                const { res } = await $fetch('/api/updatePrefs', {
                    method: 'POST',
                    body: data
                })

                this.loading = false

                await this.getUser()
            } catch {
                this.loading = false
            }
        },
        async registerUser (email: string, password: string, name: string, phone: string) {
            try {
                const { account, databases, ID } = useAppwrite();
                
                this.isLoading = true

                const registration = await account.create(ID.unique(), email, password, name);
                await account.createEmailSession(email, password);

                if(phone) {
                    await account.updatePhone(phone, password);
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

                this.getUser()
                this.isLoading = false

            } catch (error: any) {
                this.isLoading = false
                if(error['response']['message'] == 'Invalid `password` param: Password must be at least 8 characters and should not be one of the commonly used password.') {
                    //Navigate to login
                    this.errorMessage = 'Wachtwoord moet minimaal 8 character zijn';
                } else if(error['response']['message'] == 'A user with the same id, email, or phone already exists in this project.') {
                    this.errorMessage = 'Emailadres is al in gebruik, probeer in te loggen';
                } else {
                    //Navigate to login
                    this.errorMessage = 'Er iets verkeerd gegaan';
                }
            }
        },
        async logoutUser() {
            try {
                const { account, ID } = useAppwrite();
                
                await account.deleteSession("current");
                this.loggedInUser = null;
                this.isAdmin = false;
                this.students = [];
                this.lessons = [];
                this.myBookings = [];
                this.errorMessage = null;
                this.isLoading = false;

            } catch (error) {
                throw error;
            }
        },
        async addCredits(credits: number, user: User){
            try {
                const { account, databases, ID } = useAppwrite();
                
                const balance = credits - user.debits
                const data = {
                    credits: user.credits + balance,
                    debits: 0
                }

                await databases.updateDocument(
                    useRuntimeConfig().public.database,
                    'students',
                    user.$id,
                    data
                    )

                await this.getStudents()
                await this.getUser()

            }catch (error) {
            }
        },
        async getMyBookings() {
            try {
                const { account, databases, ID } = useAppwrite();
                
                const list = await databases.listDocuments(
                    useRuntimeConfig().public.database,
                    'bookings',
                    [
                        Query.equal("students", [this.loggedInUser.$id])
                    ]
                    )
                
                this.myBookings = list.documents
                await $fetch('/api/bookings', {
                    method: 'POST',
                    body: { userId: this.loggedInUser.$id }
                })

            } catch (error) {

            }
        },
        async handleBooking(lesson: Lesson){
            try {

                const user = this.onBehalfOf != null ? this.onBehalfOf : this.loggedInUser
                
                const { account, databases, ID } = useAppwrite();
                
                this.isLoading = true
                // Register booking
                const booking = await databases.createDocument(
                    useRuntimeConfig().public.database,
                    'bookings',
                    ID.unique(),
                    { lessons: lesson.$id, students: user.$id }
                    )

                // Update credits
                const credits = await $fetch('/api/updatePrefs', {
                    method: 'post',
                    body: {
                        userId: user.$id,
                        prefs: {
                            credits: +user.prefs['credits'] - 1
                        }
                    }
                })

                await this.getUser()
                const lessonsResponse = await databases.getDocument(
                    useRuntimeConfig().public.database,
                    'lessons',
                    lesson.$id,
                    )
                // Bookingsarray for email
                let bookingsArr: any[] = []
                lessonsResponse.documents.bookings.forEach((x: any) => {
                    bookingsArr.unshift({ name: x.students.name})
                })
                
                // Send email
                const emailData = {
                    body: null,
                    new_booking_name: this.onBehalfOf.name,
                    lessondate: this.formatDateInDutch(lessonsResponse.date, true),
                    spots: lessonsResponse.bookings.length,
                    bookings: bookingsArr,
                    calendar_link_apple: this.getCalenderLink('apple', lessonsResponse.date),
                    calendar_link_gmail: this.getCalenderLink('gmail', lessonsResponse.date),
                    calendar_link_outlook: this.getCalenderLink('outlook', lessonsResponse.date)
                }
                const isProd = process.env.NODE_ENV == 'production'

                if(isProd) {
                    const { body } = await $fetch('/api/sendBookingConfirmation', {
                        method: 'POST',
                        body: emailData
                    })
                }
                
                this.onBehalfOf = null
                this.isLoading = false

            }catch (error) {
                this.isLoading = false
            }
        },
        async getBookings() {
            try {
                if(this.isAdmin) {
                    const lessons = await $fetch('/api/lessonsWithBookings')
                    this.lessons = lessons.documents
                } else {
                    const lessons = await $fetch('api/lessons')
                    this.lessons = lessons.documents
                }
            } catch(error) {

            }
        },

        async cancelBooking(booking: Booking) {
            try {
                const user = this.onBehalfOf != null ? this.onBehalfOf : this.loggedInUser

                const { account, databases, ID } = useAppwrite();
                
                this.isLoading = true

                // Cancel booking
                const response = await databases.deleteDocument(
                    useRuntimeConfig().public.database,
                    'bookings',
                    booking.$id
                    )

                // Update credits
                await $fetch('/api/updatePrefs', {
                    method: 'post',
                    body: {
                        userId: user.$id,
                        prefs: {
                            credits: +user.prefs['credits'] + 1
                        }
                    }
                })

                if(this.isAdmin) {
                    await this.getStudents()
                }
                await this.getUser()
                await this.getLessons()
                
                this.isLoading = false

                const lessonsResponse = await databases.getDocument(
                    useRuntimeConfig().public.database,
                    'lessons',
                    lesson.$id,
                    )

                // Bookingsarray for email
                const bookingsArr: any = []
                lessonsResponse.bookings.forEach((x: any) => {
                    bookingsArr.unshift({ name: x.students.name})
                })

                // Send email
                const emailData = {
                    booking_name: booking.students.name,
                    lessondate: this.formatDateInDutch(lessonsResponse.date, true),
                    spots: lessonsResponse.bookings.length,
                    bookings: bookingsArr
                }
                const isProd = process.env.NODE_ENV == 'production'

                if(isProd) {
                    const { body } = await $fetch('/api/sendBookingCancellation', {
                        method: 'POST',
                        body: emailData
                    })
                }

            } catch(error) {
                this.isLoading = false
            }
        },
        
        formatDateInDutch(date: string, isLesson: boolean = false) {
            const dayjs = useDayjs()

            const lessonDate = dayjs(date).utc();
            const startTime = lessonDate.format('h');
            const endTime = lessonDate.add(1, 'hour').format('h');
            const formatted = isLesson ? `${lessonDate.format('dddd D MMMM')} van ${startTime} tot ${endTime} uur` : lessonDate.format('D MMMM YYYY');
            
            return formatted
        },
        
        getCalenderLink(stream: string, date: string) {
            const dayjs = useDayjs()

            const lessonDate = dayjs(new Date(date)).utc()
            const startTime = lessonDate.format('h')
            const link = `https://calndr.link/d/event/?service=${stream}&start=${lessonDate.format('YYYY-MM-DD')}%20${startTime}:00&title=Yogales%20Ravennah&timezone=Europe/Amsterdam&location=Emmy%20van%20Leersumhof%2024a%20Rotterdam`
            return link
        },

        async getLessons() {
            try {
                if(this.isAdmin) {
                    const lessons = await $fetch('/api/lessonsWithBookings')
                    this.lessons = lessons.documents
                } else {
                    const lessons = await $fetch('api/lessons')
                    this.lessons = lessons.documents
                }
            } catch(error) {

            }
        }
    }
})