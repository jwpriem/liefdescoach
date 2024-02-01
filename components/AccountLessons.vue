<template>
  <div v-if="isAdmin && lessons.length">
    

   <div class="w-full">
    <div class="flex justify-between items-center">
    <h2 class="text-2xl md:text-4xl uppercase font-black">
     <span class="emerald-underline text-emerald-900">Lessen</span><span class="text-emerald-700">.</span>
   </h2>
      <label class="toggle" for="two">
        <input id="two" type="checkbox" v-model="onlyFutureLessons" />
        Alleen toekomstige lessen tonen
      </label>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-4 mt-8 gap-3">
      <div v-for="lesson in onlyFutureLessons ? $rav.upcomingLessons(lessons) : lessons" index="lesson.$id" class="p-4 bg-gray-800 rounded flex flex-col gap-y-3" :class="$rav.isFutureBooking(lesson) ? '' : 'opacity-20 hover:opacity-100'">
        <div>
          <sup class="text-emerald-500">Datum</sup>
          <span class="block -mt-2">{{ $rav.formatDateInDutch(lesson.date, true) }}</span>
        </div>
        <div>
          <sup class="text-emerald-500">Boekingen ( {{ lesson.bookings.length }}/{{ lesson.spots + lesson.bookings.length }} )</sup>
          <span class="block -mt-2">
            <span v-for="booking in lesson.bookings" index="booking.$id" class="block">
              {{ booking.students.name }}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="cursor-pointer w-5 h-5 ml-3 inline-block text-red-300" @click="removeBooking(booking, lesson)">
                <path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
            </span>
            <span v-if="!lesson.bookings.length">Geen boekingen</span>
          </span>
        </div>
      </div>
    </div>
   </div>
   <div class="button button-small emerald mt-3" v-if="!bookForUser" @click="bookForUser = true">Maak boeking voor gebruiker</div>
   
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
            <option v-for="lesson in lessons" :value="lesson" v-if="$rav.isFutureBooking(lesson)" :disabled="!lesson.spots > 0">{{ $rav.formatDateInDutch(lesson.date) }} <span v-if="!lesson.spots > 0">(vol)</span><span v-else>(Nog {{lesson.spots}} {{ lesson.spots == 1 ? 'plek' : 'plekken'}})</span></option>
          </select>

          <select class="select-wrapper" v-model="addBooking.user" :disabled="!addBooking.lesson">
              <option :value="null">Kies gebruiker</option>
              <option v-for="student in students" :value="student" v-if="$rav.checkAvailability(addBooking.lesson, student)">{{ student.name }}</option>
            </select>
          <div class="flex gap-x-3">
            <button :disabled="!addBooking.user && !addBooking.lesson" class="button emerald button-small" :class="!addBooking.user && !addBooking.lesson ? 'disabled' : ''"
                    type="button" @click="book(addBooking.lesson, addBooking.user), bookForUser = false">
              Voeg toe
            </button>
            <button class="button emerald-outlined button-small" type="button" @click="cancel()">
              Annuleer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    isAdmin: {
      type: Boolean,
      default: false
    },
    lessons: {
      type: Array,
      default: []
    },
    students: {
      type: Array,
      default: []
    }
  },
  data() {
    return {
      onlyFutureLessons: true,
      bookForUser: false,
      addBooking: {
        user: null,
        lesson: null
      }
    }
  },
  methods: {
    cancel() {
      this.addBooking.user = null
      this.addBooking.lesson = null
      this.bookForUser = false
    },

    async book(lesson, user) {
      try {
        await this.$store.dispatch("handleBooking", {
          lesson: lesson,
          user: user,
          formattedDate: this.$rav.formatDateInDutch(lesson.date, true)
        });

        this.cancel()
      }
      catch(error) {

      }
    },
    
    async removeBooking(booking, lesson) {
      await this.$store.dispatch("cancelBooking", {
        booking: booking,
        lesson: lesson
      });
    }
  }
}
</script>