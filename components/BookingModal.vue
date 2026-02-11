<script setup lang="ts">
const store = useMainStore()
const toast = useToast()
const { $rav } = useNuxtApp()

const open = defineModel<boolean>({ default: false })

const lessons = computed(() => store.lessons)
const availableCredits = computed(() => store.availableCredits)

function checkBooking(id: string) {
  return store.myBookings.some(booking => {
    const l = booking.lessons
    if (Array.isArray(l)) return l.some((li: any) => li.$id === id)
    return l?.$id === id
  })
}

function spotsLeft(lesson: any): number {
  return 9 - (lesson.bookings?.length || 0)
}

async function book(lesson: any) {
  if (!store.loggedInUser) return
  await store.setOnBehalfOf(store.loggedInUser)
  await store.handleBooking(lesson)

  if (!store.errorMessage) {
    toast.add({
      id: 'booking',
      title: 'Tot snel',
      icon: 'i-heroicons-check-badge',
      color: 'primary',
      description: 'Je les is geboekt!'
    })
  }

  store.fetchLessons()
}

onMounted(() => {
  if (store.lessons.length === 0) {
    store.fetchLessons()
  }
})
</script>

<template>
  <div v-if="open" class="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4" @click.self="open = false">
    <div
      class="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-6 sm:p-8">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-emerald-100 tracking-tight">Boek een les</h2>
        <button @click="open = false"
          class="text-gray-400 hover:text-gray-200 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
            stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Credit balance -->
      <div class="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
          stroke="currentColor" class="w-5 h-5 text-emerald-400 shrink-0">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
        </svg>
        <span class="text-sm text-emerald-300">
          <strong>{{ availableCredits }}</strong> {{ availableCredits == 1 ? 'credit' : 'credits' }} beschikbaar
        </span>
      </div>

      <!-- Lessons list -->
      <div v-if="lessons.length" class="flex flex-col gap-y-3">
        <div v-for="lesson in lessons" :key="lesson.$id"
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-gray-800/50 p-4 transition-colors"
          :class="checkBooking(lesson.$id) ? 'bg-emerald-500/5' : 'bg-gray-900/30'">

          <!-- Lesson info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <!-- Guest lesson icon -->
              <svg v-if="lesson.type == 'guest lesson'" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                class="w-5 h-5 shrink-0 text-emerald-500">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
              </svg>
              <!-- Regular lesson icon -->
              <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                stroke="currentColor" class="w-5 h-5 shrink-0 text-emerald-500">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
              </svg>
              <span class="font-medium text-gray-100 text-sm" v-html="$rav.getLessonTitle(lesson)"></span>
            </div>
            <div class="flex items-center gap-4 text-sm text-gray-400">
              <span>{{ $rav.formatDateInDutch(lesson.date, true) }}</span>
              <span v-if="spotsLeft(lesson) > 0" class="text-emerald-400/70">{{ spotsLeft(lesson) }} {{ spotsLeft(lesson) == 1 ? 'plek' : 'plekken' }}</span>
              <span v-else class="text-red-400/70">Vol</span>
            </div>
          </div>

          <!-- Action -->
          <div class="shrink-0">
            <!-- Already booked -->
            <span v-if="checkBooking(lesson.$id)"
              class="flex items-center gap-1.5 text-sm text-emerald-400 font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Geboekt
            </span>
            <!-- Full -->
            <span v-else-if="spotsLeft(lesson) <= 0"
              class="text-sm text-gray-500 font-medium">
              Vol
            </span>
            <!-- Book button -->
            <UButton v-else
              :disabled="availableCredits < 1"
              color="primary" variant="solid" size="sm"
              @click="book(lesson)">
              {{ availableCredits < 1 ? 'Geen credits' : 'Boek' }}
            </UButton>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-8">
        <p class="text-gray-400">Geen lessen beschikbaar</p>
      </div>
    </div>
  </div>
</template>
