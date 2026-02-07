<script setup lang="ts">
const store = useMainStore()
const { $rav } = useNuxtApp()

const myBookings = computed(() => store.myBookings);
const isAdmin = computed(() => store.isAdmin);

async function removeBooking(booking) {
  await store.cancelBooking(
    booking
  )

  await $fetch('/api/mail/send', {
    method: 'POST',
    body: {
      type: 'booking-cancellation-notification',
      data: {
        name: store.loggedInUser.name,
        email: store.loggedInUser.email,
        lessonType: $rav.getLessonTitle(booking.lessons),
        lessonDate: $rav.formatDateInDutch(booking.lessons.date, true),
        spots: 0,
        bookings: [],
      }
    }
  })
}
</script>

<template>
  <div v-if="!isAdmin">
    <h2 class="text-2xl md:text-4xl uppercase font-black mb-6">
     <span class="emerald-underline text-emerald-900">Boekingen</span><span class="text-emerald-700">.</span>
   </h2>

   <div class="w-full" v-if="myBookings">
     <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
       <div v-for="booking in myBookings" index="booking.$id"
            class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-6"
            v-show="$rav.isFutureBooking(booking.lessons.date)">
          <div class="space-y-4">
            <div>
              <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Les</span>
              <span class="block mt-1 text-gray-100 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-emerald-500 shrink-0">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                </svg>
                <span v-html="$rav.getLessonDescription(booking.lessons)"></span>
              </span>
            </div>

            <div>
              <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Datum</span>
              <span class="block mt-1 text-gray-100 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-emerald-500 shrink-0">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
                {{ $rav.formatDateInDutch(booking.lessons.date, true) }}
              </span>
            </div>

            <div>
              <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Zet in je agenda</span>
              <div class="flex gap-3 mt-2">
                <a :href="$rav.getCalenderLink('apple', booking.lessons.date, booking.lessons.type)" class="hover:opacity-80 transition-opacity"><NuxtImg src="/apple.png" class="w-6" /></a>
                <a :href="$rav.getCalenderLink('google', booking.lessons.date, booking.lessons.type)" class="hover:opacity-80 transition-opacity"><NuxtImg src="/gmail.png" class="w-6" /></a>
                <a :href="$rav.getCalenderLink('outlook', booking.lessons.date, booking.lessons.type)" class="hover:opacity-80 transition-opacity"><NuxtImg src="/outlook.png" class="w-6" /></a>
              </div>
            </div>

            <UButton color="primary" variant="solid" size="lg" block @click="removeBooking(booking)" :disabled="!$rav.checkCancelPeriod(booking.lessons)">Les annuleren</UButton>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-5 text-gray-400" v-else>
      Je hebt nog geen boekingen
    </div>
  </div>
</template>
