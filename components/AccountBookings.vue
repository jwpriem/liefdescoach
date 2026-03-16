<script setup lang="ts">
const store = useMainStore()
const { $rav } = useNuxtApp()

const myBookings = computed(() => store.myBookings)
const availableCredits = computed(() => store.availableCredits)
const openBookingModal = inject('openBookingModal') as () => void

const futureBookingGroups = computed(() => {
  if (!myBookings.value) return []

  const grouped = new Map<string, any>()

  myBookings.value
    .map((booking: any) => {
      const lesson = Array.isArray(booking.lessons) ? booking.lessons[0] : booking.lessons
      return { ...booking, lessons: lesson }
    })
    .filter((booking: any) => booking.lessons && $rav.isFutureBooking(booking.lessons.date))
    .forEach((booking: any) => {
      const lessonId = booking.lessons.$id
      const current = grouped.get(lessonId)

      if (!current) {
        grouped.set(lessonId, {
          lessonId,
          lessons: booking.lessons,
          bookings: [booking],
          spots: 1,
        })
        return
      }

      current.bookings.push(booking)
      current.spots += 1
    })

  return [...grouped.values()].sort((a, b) => new Date(a.lessons.date).getTime() - new Date(b.lessons.date).getTime())
})

async function removeBooking(bookingGroup: any) {
  const bookingToCancel = bookingGroup.bookings[bookingGroup.bookings.length - 1]
  await store.cancelBooking(bookingToCancel)
}

async function bookExtraSpot(lesson: any) {
  await store.handleBooking(lesson, { extraSpot: true })
}
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/15">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-emerald-400">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
          </svg>
        </div>
        <div>
          <span class="text-sm text-gray-400">Beschikbaar saldo</span>
          <span class="block text-lg font-bold text-emerald-100">{{ availableCredits }} {{ availableCredits == 1 ? 'les' : 'lessen' }}</span>
        </div>
      </div>

      <UButton v-if="availableCredits > 0" color="primary" variant="solid" size="lg" icon="i-lucide-plus" @click="openBookingModal()">
        Boek een les
      </UButton>
      <UButton v-else to="/tarieven" color="primary" variant="outline" size="lg" icon="i-lucide-shopping-cart">
        Koop credits
      </UButton>
    </div>

    <h2 class="text-2xl md:text-4xl uppercase font-black mb-6">
      <span class="emerald-underline text-emerald-900">Boekingen</span><span class="text-emerald-700">.</span>
    </h2>

    <div class="w-full" v-if="futureBookingGroups.length">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="bookingGroup in futureBookingGroups" :key="bookingGroup.lessonId"
             class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-6">
          <div class="space-y-4">
            <div>
              <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Les</span>
              <span class="block mt-1 text-gray-100 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-emerald-500 shrink-0">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                </svg>
                <span v-html="$rav.getLessonDescription(bookingGroup.lessons)"></span>
              </span>
            </div>

            <div>
              <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Aantal plekken</span>
              <span class="block mt-1 text-gray-100">{{ bookingGroup.spots }} {{ bookingGroup.spots === 1 ? 'plek' : 'plekken' }}</span>
            </div>

            <div>
              <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Datum</span>
              <span class="block mt-1 text-gray-100 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-emerald-500 shrink-0">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
                {{ $rav.formatDateInDutch(bookingGroup.lessons.date, true) }}
              </span>
            </div>

            <div>
              <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Zet in je agenda</span>
              <div class="flex gap-3 mt-2">
                <a :href="$rav.getCalenderLink('apple', bookingGroup.lessons.date, bookingGroup.lessons.type)" class="hover:opacity-80 transition-opacity"><NuxtImg src="/apple.png" class="w-6" /></a>
                <a :href="$rav.getCalenderLink('google', bookingGroup.lessons.date, bookingGroup.lessons.type)" class="hover:opacity-80 transition-opacity"><NuxtImg src="/gmail.png" class="w-6" /></a>
                <a :href="$rav.getCalenderLink('outlook', bookingGroup.lessons.date, bookingGroup.lessons.type)" class="hover:opacity-80 transition-opacity"><NuxtImg src="/outlook.png" class="w-6" /></a>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <UButton color="primary" variant="outline" size="lg" block :disabled="availableCredits < 1" @click="bookExtraSpot(bookingGroup.lessons)">Boek extra plek</UButton>
              <UButton color="primary" variant="solid" size="lg" block @click="removeBooking(bookingGroup)" :disabled="!$rav.checkCancelPeriod(bookingGroup.lessons)">Annuleer 1 plek</UButton>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm p-8 text-center" v-else>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 text-gray-600 mx-auto mb-3">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
      <p class="text-gray-400 mb-4">Je hebt nog geen boekingen</p>
      <UButton v-if="availableCredits > 0" color="primary" variant="solid" icon="i-lucide-plus" @click="openBookingModal()">
        Boek je eerste les
      </UButton>
      <UButton v-else to="/tarieven" color="primary" variant="outline" icon="i-lucide-shopping-cart">
        Koop credits om te boeken
      </UButton>
    </div>

  </div>
</template>
