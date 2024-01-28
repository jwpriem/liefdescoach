<template>
  <div>
    <IsLoading :loading="isLoading" />
    <!--Pop up for editing details-->
    <div v-if="editAccount" class="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div class="w-full max-height-75 overflow-y-scroll sm:w-2/3 md:w-1/2 bg-gray-800 p-6 rounded-lg shadow-lg">
        <!-- Your form content goes here -->
        <div class="w-full flex flex-col gap-y-5">
          <h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline text-emerald-900"
              >Bewerk gegevens</span
              ><span class="text-emerald-700">.</span>
          </h2>
          <div>
          <div class="flex items-center justify-start">
            <label>E-mail</label>
          </div>
          <input id="email"
            v-model="email"
            type="text"
            placeholder="Je e-mailadres"
            class="w-full"
          />
        </div>
        <div>
          <div class="flex items-center justify-start">
            <label>Naam</label>
          </div>
          <input id="name"
            v-model="name"
            type="text"
            placeholder="Je naam"
            class="w-full"
          />
        </div>
        <div>
          <div class="flex items-center justify-start">
            <label>Telefoonnummer</label>
          </div>
          <input id="phone"
            v-model="phone"
            type="text"
            placeholder="Je telefoonnummer"
            class="w-full"
          />
        </div>
        <div>
          <div class="flex items-center justify-start">
            <label>Wachtwoord (om de wijzigen op te slaan)</label>
          </div>
          <input id="password"
            v-model="password"
            type="password"
            placeholder="Je wachtwoord"
            class="w-full"
          />
        </div>
          <div class="flex gap-x-3">
            <button :disabled="!password" class="button emerald button-small" :class="!password ? 'disabled' : ''"
                    type="button" @click="updateAccount()">
              Opslaan
            </button>
            <button class="button emerald-outlined button-small" type="button" @click="cancelAccount()">
              Annuleer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!--Pop up for adding credits-->
    <div v-if="editCredits" class="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div class="w-full max-height-75 overflow-y-scroll sm:w-2/3 md:w-1/2 bg-gray-800 p-6 rounded-lg shadow-lg">
        <!-- Your form content goes here -->
        <div class="w-full flex flex-col gap-y-5">
          <h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline text-emerald-900"
              >Voeg credits toe</span
              ><span class="text-emerald-700">.</span>
          </h2>
          <div>
            <div class="flex items-center justify-start">
              <label>Credits toevoegen</label>
            </div>
            <input id="add-credits"
              v-model="addCredits"
              type="number"
              placeholder="Aantal credits om toe te voegen"
              class="w-full"
            />
          </div>
          <div class="flex gap-x-3">
            <button class="button emerald button-small" type="button" @click="updateCredits()">
              Voeg credits toe
            </button>
            <button class="button emerald-outlined button-small" type="button" @click="cancel()">
              Annuleer
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!--Book for user-->
    <div v-if="bookForUser" class="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div class="w-full max-height-75 overflow-y-scroll sm:w-2/3 md:w-1/2 bg-gray-800 p-6 rounded-lg shadow-lg">
        <!-- Your form content goes here -->
        <div class="w-full flex flex-col gap-y-5">
          <h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline text-emerald-900"
              >Voeg boeking toe</span
              ><span class="text-emerald-700">.</span>
          </h2>

          <select class="select-wrapper" v-model="addBooking.lesson">
            <option :value="null">Kies datum</option>
            <option v-for="lesson in lessons" :value="lesson" v-if="isFutureBooking(lesson)">{{ formatDateInDutch(lesson.date) }}</option>
          </select>

          <select class="select-wrapper" v-model="addBooking.user">
              <option :value="null">Kies gebruiker</option>
              <option v-for="student in students" :value="student">{{ student.name }}</option>
            </select>
          <div class="flex gap-x-3">
            <button :disabled="!addBooking.user && !addBooking.lesson" class="button emerald button-small" :class="!addBooking.user && !addBooking.lesson ? 'disabled' : ''"
                    type="button" @click="book(addBooking.lesson, addBooking.user)">
              Voeg toe
            </button>
            <button class="button emerald-outlined button-small" type="button" @click="cancelBooking()">
              Annuleer
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="container mt-8 sm:mt-12 md:mt-24 mx-auto p-8 md:px-0 md:py-24">
      <div>
        <div v-if="loggedInUser">
          <h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline text-emerald-900"
              >Mijn gegevens</span
              ><span class="text-emerald-700">.</span>
          </h2>
          <div class="p-4 bg-gray-800 rounded flex flex-col gap-y-3 w-full md:w-1/2 mt-8 mb-4"">
            <div>
              <sup class="text-emerald-500">Naam</sup>
              <span class="block -mt-2">{{ loggedInUser.name }}</span>
            </div>
            <div>
              <sup class="text-emerald-500">Email</sup>
              <span class="block -mt-2">{{ loggedInUser.email }}</span>
            </div>
            <div>
              <sup class="text-emerald-500">Telefoon</sup>
              <span class="block -mt-2" v-if="loggedInUser.phone">{{ loggedInUser.phone }}</span>
              <span class="block -mt-2" v-else>Geen telefoonnummer</span>
            </div>
            <div>
              <sup class="text-emerald-500">Credits</sup>
              <span class="block -mt-2 flex flex-no-wrap align-center justify-start gap-x-2">{{ loggedInUser.credits }}</span>
            </div>
            <div>
              <sup class="text-emerald-500">Te betalen lessen</sup>
              <span class="block -mt-2 flex flex-no-wrap align-center justify-start gap-x-2">{{ loggedInUser.debits }}</span>
            </div>
            <div>
              <sup class="text-emerald-500">Geregistreerd op</sup>
              <span class="block -mt-2">{{ formatDateInDutch(loggedInUser.registration) }}</span>
            </div>
          </div>

          <div class="button button-small emerald" v-if="!editAccount" @click="setUserAccount()">Gegevens bewerken</div>

        </div>
      </div>
      <div v-if="!isAdmin && myBookings.length" Class="mt-12">
        <h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline text-emerald-900"
              >Boekingen</span
              ><span class="text-emerald-700">.</span>
        </h2>
        <div class="w-full">
           <div class="flex flex-col mt-8 gap-3">
          <div v-for="booking in myBookings" index="booking.$id" class="p-4 bg-gray-800 rounded flex flex-col gap-y-3 w-full md:w-1/4" v-if="isFutureBooking(booking.lessons)">
            <div>
              <sup class="text-emerald-500">Datum</sup>
              <span class="block -mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                     stroke="currentColor" class="w-6 h-6 mr-1 inline-block stroke-current text-emerald-700">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                  </svg>
                  {{ formatDateInDutch(booking.lessons.date, true) }}
                </span>
                <button class="button emerald button-small mt-3" @click="removeBooking(booking, booking.lessons)" v-if="checkCancelPeriod(booking.lessons)">
                  Les annuleren
                </button>
            </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="isAdmin && students.length" Class="mt-12">
        <h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline text-emerald-900"
              >Gebruikers</span
              ><span class="text-emerald-700">.</span>
        </h2>
        <div class="w-full">
        <div class="grid grid-cols-1 md:grid-cols-4 mt-8 gap-3">
          <div v-for="student in students" index="student.$id" class="p-4 bg-gray-800 rounded flex flex-col gap-y-3 w-full" v-if="student.$id != loggedInUser.$id">
            <div>
              <sup class="text-emerald-500">Naam</sup>
              <span class="block -mt-2">{{ student.name }}</span>
            </div>
            <div>
              <sup class="text-emerald-500">Email</sup>
              <span class="block -mt-2">{{ student.email }}</span>
            </div>
            <div>
              <sup class="text-emerald-500">Telefoon</sup>
              <span class="block -mt-2" v-if="student.phone">{{ student.phone }}</span>
              <span class="block -mt-2" v-else>Geen telefoonnummer</span>
            </div>
            <div>
              <sup class="text-emerald-500">Credits - Te betalen</sup>
              <span class="block -mt-2 flex flex-no-wrap align-center justify-start gap-x-2">{{ student.credits }} - {{ student.debits }} <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                     stroke="currentColor" class="w-6 h-6 cursor-pointer"
                     @click="setUserData(student)">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                </svg>
              </span>
            </div>
            <div>
              <sup class="text-emerald-500">Geregistreerd</sup>
              <span class="block -mt-2">{{ formatDateInDutch(student.registration) }}</span>
            </div>
          </div>
        </div>
        

          <div class="mt-12 w-full">
            <h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline text-emerald-900"
              >Lessen</span
              ><span class="text-emerald-700">.</span>
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-4 mt-8 gap-3">
              <div v-for="lesson in lessons" index="lesson.$id" class="p-4 bg-gray-800 rounded flex flex-col gap-y-3" :class="isFutureBooking(lesson) ? '' : 'opacity-20 hover:opacity-100'">
                <div>
                  <sup class="text-emerald-500">Datum</sup>
                  <span class="block -mt-2">{{ formatDateInDutch(lesson.date, true) }}</span>
                </div>
                <div>
                  <sup class="text-emerald-500">Boekingen ( {{ lesson.bookings.length }}/{{ lesson.spots + lesson.bookings.length }} )</sup>
                  <span class="block -mt-2">
                <span v-for="booking in lesson.bookings" index="booking.$id" class="block">{{
                    booking.students.name
                  }}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 ml-3 inline-block text-red-300" @click="removeBooking(booking, lesson)">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                  </svg>

                </span>
                <span v-if="!lesson.bookings.length">Geen boekingen</span>
              </span>
                </div>
              </div>
            </div>
            <div class="button button-small emerald mt-3" v-if="!bookForUser" @click="setBookForUser()">Maak boeking voor gebruiker</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs';
import 'dayjs/locale/nl';
const utc = require('dayjs/plugin/utc');

export default {
  layout: "yoga",
  data() {
    return {
      editCredits: false,
      addCredits: null,
      user: null,
      name: null,
      password: null,
      email: null,
      phone: null,
      editAccount: false,
      bookForUser: false,
      addBooking: {
        user: null,
        lesson: null
      }
    }
  },
  methods: {
    setUserData(user) {
      this.user = user
      this.editCredits = true
    },

    setUserAccount() {
      this.name = this.loggedInUser.name
      this.email = this.loggedInUser.email
      this.phone = this.loggedInUser.phone
      this.editAccount = true
    },
    
    setBookForUser() {
      this.bookForUser = true
    },

    cancel() {
      this.user = null
      this.addCredits = null
      this.editCredits = false
    },

    cancelAccount() {
      this.name = null
      this.email = null
      this.phone = null
      this.password = null
      this.editAccount = false
    },
    
    cancelBooking() {
      this.addBooking.user = null
      this.addBooking.lesson = null
      this.bookForUser = false
    },

    async updateAccount() {
      try {
        await this.$store.dispatch('updateAccount', {
          name: this.name,
          password: this.password,
          phone: this.formatPhoneNumber(this.phone),
          email: this.email
        })
        this.cancelAccount()
        await this.$store.dispatch('getAccountDetails', {route: this.$route.fullPath})

      } catch (error) {
        console.log(error)
      }
    },

    formatPhoneNumber(input) {
      // Remove all non-digit characters
      let digits = input.replace(/\D/g, '');

      // Check if the number starts with '06' and replace with '316'
      if (digits.startsWith('06')) {
        digits = '31' + digits.substring(1);
      }

      // Validate if the number is now in the correct format
      if (!/^31[0-9]{9}$/.test(digits)) {
        console.log('Invalid phone number format');
      }

      // Reconstruct the phone number with the country code +31
      return `+${digits}`;
    },

    async updateCredits() {
      try {
        await this.$store.dispatch("addCredits", {
          credits: this.addCredits,
          user: this.user
        });

        this.cancel()
      } catch (error) {
        console.error("Login failed:", error);
      }
    },
    formatDateInDutch(lesson, isLesson = false) {
      dayjs.locale('nl'); // Set locale to Dutch
      dayjs.extend(utc)

      const lessonDate = dayjs(new Date(lesson)).utc()
      const startTime = lessonDate.format('h')
      const endTime = lessonDate.add(1, 'hour').format('h')
      const formattedDate = isLesson ? `${lessonDate.format('dddd D MMMM')} van ${startTime} tot ${endTime} uur` : lessonDate.format('D MMMM YYYY')


      return formattedDate
    },
    isFutureBooking(lesson) {
      const lessonDate = dayjs(new Date(lesson.date))
      return dayjs().isBefore(lessonDate)
    },

    checkCancelPeriod(lesson) {
      dayjs.extend(utc)

      return dayjs().utc().isBefore(dayjs(new Date(lesson.date)).utc().subtract(1, 'day'))
    },

    async book(lesson, user) {
      try {
        await this.$store.dispatch("handleBooking", {
          lesson: lesson,
          user: user
        });

        this.cancelBooking()
      }
      catch(error) {
        console.log(error)
      }
    },

    async removeBooking(booking, lesson) {
      await this.$store.dispatch("cancelBooking", {
        booking: booking,
        lesson: lesson
      });
    }
  },
  computed: {
    loggedInUser() {
      return this.$store.getters.loggedInUser;
    },
    isAdmin() {
      return this.$store.getters.isAdmin;
    },
    students() {
      return this.$store.getters.students;
    },
    lessons() {
      return this.$store.getters.lessons;
    },
    myBookings() {
      return this.$store.getters.myBookings
        .filter(booking => {
          const lessonDate = dayjs(new Date(booking.lessons.date))
          return dayjs().isBefore(lessonDate)
        })
    },
    isLoading() {
      return this.$store.getters.isLoading
    }
  }
};
</script>
