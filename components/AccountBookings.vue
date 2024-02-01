<template>
  <div v-if="!isAdmin && bookings.length">
    <h2 class="text-2xl md:text-4xl uppercase font-black">
     <span class="emerald-underline text-emerald-900">Boekingen</span><span class="text-emerald-700">.</span>
   </h2>

   <div class="w-full">
     <div class="flex flex-col mt-8 gap-3">
        <div v-for="booking in bookings" index="booking.$id" class="p-4 bg-gray-800 rounded flex flex-col gap-y-3 w-full md:w-1/4" v-if="$rav.isFutureBooking(booking.lessons)">
          <div>
            <sup class="text-emerald-500">Datum</sup>
            <span class="block -mt-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mr-1 inline-block stroke-current text-emerald-700">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
              </svg>
              {{ $rav.formatDateInDutch(booking.lessons.date, true) }}
            </span>
  
            <div class="flex gap-x-3 my-2">
              <a :href="$rav.getCalenderLink('apple', booking.lessons.date)"><img src="/apple.png" class="w-6" /></a>
              <a :href="$rav.getCalenderLink('google', booking.lessons.date)"><img src="/gmail.png" class="w-6" /></a>
              <a :href="$rav.getCalenderLink('outlook', booking.lessons.date)"><img src="/outlook.png" class="w-6" /></a>
            </div>
  
            <button class="button emerald button-small mt-3" @click="removeBooking(booking, booking.lessons)" v-if="$rav.checkCancelPeriod(booking.lessons)">
              Les annuleren
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
    bookings: {
      type: Array,
      default: []
    }
  },
  methods: {
    async removeBooking(booking, lesson) {
      await this.$store.dispatch("cancelBooking", {
        booking: booking,
        lesson: lesson
      });
    }
  }
}
</script>