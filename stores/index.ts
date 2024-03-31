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
    phone?: string;
    credits?: number;
    debits?: number;
    labels?: string[];
    registration?: string;
}

interface Lesson {
    $id: string;
    date: string;
    spots: number;
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
        async loginUser(email: string, password: string) {
            this.isLoading = true
            const { account, ID } = useAppwrite();
            
            try {
                await account.createEmailSession(email, password);
                await this.getAccountDetails( '/yoga/login');
                this.errorMessage = null;
                this.isLoading = false
            } catch (error: any) {
                this.isLoading = false
                console.log(JSON. stringify(error))
                if(error['type'] == 'user_invalid_credentials') {
                    //Navigate to login
                    this.errorMessage = 'Verkeerde gebruikersnaam of wachtwoord';
                } else {
                    //Navigate to login
                    this.errorMessage = 'Er iets verkeerd gegaan'
                }
            }
        },
        async setOnBehalfOf(user: User) {
            this.onBehalfOf = user
        },
        async getAccountDetails(route: string){
            try {
                const { account, databases, ID } = useAppwrite();
                
                const user = await account.get();

                const res = await databases.getDocument(
                    useRuntimeConfig().public.database,
                    'students',
                    user.$id
                    );
                
                this.loggedInUser = user
                this.loggedInUser.credits = res.credits
                this.loggedInUser.debits = res.debits
                this.isAdmin = user.labels.includes('admin')

                // Only admin calls
                if(user.labels.includes('admin')) {
                    await this.getStudents()
                    await this.getLessons()
                }

                await this.getMyBookings()
            } catch (error) {
                //      const str = JSON.stringify(error, null, 4); // (Optional) beautiful indented output.
                if(route){
                    if(route == '/yoga/account') {
                        //          $nuxt.$router.push('/yoga/login')
                    }
                }
            }
        },
        async phoneUpdate(phone: string, password: string) {
            try {
                const { account, databases, ID } = useAppwrite();
                this.isLoading = true
                
                await account.updatePhone(phone, password)

                await databases.updateDocument(
                    useRuntimeConfig().public.database,
                    'students',
                    this.loggedInUser.$id,
                    { phone: phone}
                    );
                
                this.isLoading = false
                await this.getAccountDetails('/yoga/account');
            } catch(error) {
                this.isLoading = false
            }
        },
        async emailUpdate(email: string, password: string) {
            try {
                const { account, databases, ID } = useAppwrite();
                this.isLoading = true
                
                await account.updateEmail(email, password)

                await databases.updateDocument(
                    useRuntimeConfig().public.database,
                    'students',
                    this.loggedInUser.$id,
                    { email: email}
                    );
                
                this.isLoading = false
                await this.getAccountDetails('/yoga/account');
                
            } catch(error) {
                this.isLoading = false
            }
        },
        async nameUpdate(name: string, password: string) {
            try {
                const { account, databases, ID } = useAppwrite();
                this.isLoading = true
                
                await account.updateName(name, password)

                await databases.updateDocument(
                    useRuntimeConfig().public.database,
                    'students',
                    this.loggedInUser.$id,
                    { name: name}
                    );
                
                this.isLoading = false
                await this.getAccountDetails('/yoga/account');
                
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
                await this.getAccountDetails('/yoga/account')

            } catch(error) {
                this.isLoading = false
            }
        },
        async updatePrefs(prefs: Object) {
            this.loading = true
            try {
                const { account } = useAppwrite();
                await account.updatePrefs(prefs)
                this.loading = false
                await this.getAccountDetails('/yoga/account')
            } catch {
                this.loading = false
            }
        },
        async registerUser (email: string, password: string, name: string, phone: string) {
            try {
                const { account, databases, ID } = useAppwrite();
                
                this.isLoading = true

                await account.create(ID.unique(), email, password, name);
                await account.createEmailSession(email, password);

                if(phone) {
                    await account.updatePhone(phone, password);
                }

                const user = await account.get();

                let data = {
                    credits: 0,
                    debits: 0,
                    name: user.name,
                    email: user.email,
                    phone: phone ? user.phone : null,
                    registration: user.registration
                }

                const res = await databases.createDocument(
                    useRuntimeConfig().public.database,
                    'students',
                    user.$id,
                    data
                    );

                this.loggedInUser = user
                this.loggedInUser.credits = res.credits
                this.loggedInUser.debits = res.debits
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
        async getStudents() {
            try {
                const { account, databases, ID } = useAppwrite();
                
                if(this.isAdmin){
                    const list = await databases.listDocuments(
                        useRuntimeConfig().public.database,
                        'students',
                        [
                            Query.orderAsc('name'),
                            ]
                            )
                    this.students = list.documents
                } else {
                    this.students = []
                }
            }catch (error) {
            }
        },
        async getLessons() {
            try {
                const { account, databases, ID } = useAppwrite();
                
                const list = await databases.listDocuments(
                    useRuntimeConfig().public.database,
                    'lessons',
// fix not getting bookings without login
//                    this.loggedInUser ? [] : [ Query.select(['date', '$id', 'spots']) ]
                    )

                this.lessons = list.documents
                //      this.lessons = list.documents.sort((a, b) => new Date(a.date) - new Date(b.date)))

            }catch (error) {
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
                await this.getAccountDetails()

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
            } catch (error) {

            }
        },
        async handleBooking(lesson: Lesson){
            try {
                const user = this.onBehalfOf != null ? this.onBehalfOf : this.loggedInUser
                
                const { account, databases, ID } = useAppwrite();
                
                this.isLoading = true
                // Register booking
                await databases.createDocument(
                    useRuntimeConfig().public.database,
                    'bookings',
                    ID.unique(),
                    { lessons: lesson.$id, students: user.$id }
                    )

                // Update student credits/debits
                let data = {
                    credits: user.credits,
                    debits: user.debits
                }

                if(user.credits <= 0) {
                    data['debits'] = user.debits + 1
                } else {
                    data['credits'] = user.credits - 1
                }

                await databases.updateDocument(
                    useRuntimeConfig().public.database,
                    'students',
                    user.$id,
                    data
                    )

                // Update availability lesson
                const lessonsResponse = await databases.updateDocument(
                    useRuntimeConfig().public.database,
                    'lessons',
                    lesson.$id,
                    { spots: lesson.spots - 1 }
                    )
                
                await this.getStudents();
                await this.getAccountDetails('/yoga/account');
                await this.getLessons();
                console.log(lessonsResponse)
                // Bookingsarray for email
                let bookingsArr: any[] = []
                lessonsResponse.bookings.forEach((x: any) => {
                    bookingsArr.unshift({ name: x.students.name})
                })
                
                // Send email
                const emailData = {
                    body: null,
                    new_booking_name: this.onBehalfOf.name,
                    lessondate: this.formatDateInDutch(lessonsResponse.date, true),
                    spots: lessonsResponse.spots,
                    bookings: bookingsArr,
                    calendar_link_apple: this.getCalenderLink('apple', lessonsResponse.date),
                    calendar_link_gmail: this.getCalenderLink('gmail', lessonsResponse.date),
                    calendar_link_outlook: this.getCalenderLink('outlook', lessonsResponse.date)
                }
                
                const { body } = await $fetch('/api/sendBookingConfirmation', {
                    method: 'POST',
                    body: emailData
                })
                
                this.onBehalfOf = null
                this.isLoading = false

            }catch (error) {
                this.isLoading = false
            }
        },
        async cancelBooking(booking: Booking, lesson: Lesson) {
            try {
                const { account, databases, ID } = useAppwrite();
                
                this.isLoading = true
                
                // Update availability lesson
                const lessonsResponse = await databases.updateDocument(
                    useRuntimeConfig().public.database,
                    'lessons',
                    lesson.$id,
                    { spots: lesson.spots + 1 }
                    )

                await databases.updateDocument(
                    useRuntimeConfig().public.database,
                    'students',
                    booking.students.$id,
                    { credits: booking.students.credits + 1 }
                    )

                await databases.deleteDocument(
                    useRuntimeConfig().public.database,
                    'bookings',
                    booking.$id
                    )

                await this.getStudents()
                await this.getAccountDetails('/yoga/account')
                await this.getLessons()
                
                this.isLoading = false

                // Bookingsarray for email
                const bookingsArr: any = []
                lessonsResponse.bookings.forEach((x: any) => {
                    bookingsArr.unshift({ name: x.students.name})
                })

                // Send email
                const emailData = {
                    booking_name: booking.students.name,
                    lessondate: this.formatDateInDutch(lessonsResponse.date, true),
                    spots: lessonsResponse.spots,
                    bookings: bookingsArr
                }
                
                const { body } = await $fetch('/api/SendBookingCancellation', {
                    method: 'POST',
                    body: emailData
                })

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
    }
})