<script setup lang="ts">
const { myBookings } = useBookings()
const { availableCredits } = useCredits()
const { user: loggedInUser } = useAuth()
const { $rav } = useNuxtApp()

const openBookingModal = inject('openBookingModal') as () => void

const showBuyCredits = ref(false)

const futureBookings = computed(() => {
  if (!myBookings.value) return []
  return myBookings.value
    .map((booking: any) => {
      const lesson = Array.isArray(booking.lessons) ? booking.lessons[0] : booking.lessons
      return { ...booking, lessons: lesson }
    })
    .filter((booking: any) => booking.lessons && $rav.isFutureBooking(booking.lessons.date))
    // ⚡ Bolt: Prevent expensive Date instantiations inside the sort loop by directly comparing ISO strings
    .sort((a: any, b: any) => a.lessons.date < b.lessons.date ? -1 : a.lessons.date > b.lessons.date ? 1 : 0)
})

const nextBooking = computed(() => futureBookings.value[0] ?? null)
const upcomingCount = computed(() => futureBookings.value.length)

const greeting = computed(() => {
  const hour = new Date().getHours()
  const name = loggedInUser.value?.name?.split(' ')[0] ?? ''
  if (hour < 12) return `Goedemorgen${name ? ', ' + name : ''}!`
  if (hour < 18) return `Goedemiddag${name ? ', ' + name : ''}!`
  return `Goedenavond${name ? ', ' + name : ''}!`
})

function askQuestion() {
  window.location.href = 'https://wa.me/+31647699709?text=Hi Ravennah, ik heb een vraag'
}
</script>

<template>
  <div>
    <!-- Greeting -->
    <h2 class="text-2xl md:text-4xl uppercase font-black mb-6">
      <span class="emerald-underline text-emerald-900">{{ greeting }}</span>
    </h2>

    <!-- Next lesson tile (highlighted) -->
    <div class="mb-4">
      <div
        v-if="nextBooking"
        class="rounded-2xl border p-5 shadow-2xl shadow-emerald-950/30 bg-gradient-to-br from-emerald-950/60 to-gray-950 border-emerald-700/50"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <span class="text-xs font-medium text-emerald-400 uppercase tracking-widest">Volgende les</span>
            <h3 class="text-xl font-bold text-white mt-1">{{ $rav.getLessonTitle(nextBooking.lessons) }}</h3>
            <p class="text-sm text-emerald-300/80 mt-1 capitalize">{{ $rav.formatDateInDutch(nextBooking.lessons.date, true) }}</p>
          </div>
          <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/20 shrink-0">
            <UIcon name="i-lucide-calendar-days" class="size-6 text-emerald-400" />
          </div>
        </div>
      </div>

      <div
        v-else
        class="rounded-2xl border border-gray-800/80 bg-gray-950/50 backdrop-blur-sm p-5 flex items-center justify-between gap-4"
      >
        <div>
          <span class="text-xs font-medium text-gray-500 uppercase tracking-widest">Volgende les</span>
          <p class="text-base font-semibold text-gray-300 mt-1">Geen komende boekingen</p>
          <p class="text-sm text-gray-500 mt-0.5">Plan een les om te beginnen</p>
        </div>
        <UButton
          v-if="availableCredits > 0"
          color="primary"
          variant="solid"
          size="sm"
          icon="i-lucide-plus"
          @click="openBookingModal()"
        >
          Boek
        </UButton>
        <UButton
          v-else
          color="primary"
          variant="outline"
          size="sm"
          icon="i-lucide-shopping-cart"
          @click="showBuyCredits = true"
        >
          Credits
        </UButton>
      </div>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-2 gap-4 mb-4">
      <!-- Upcoming bookings -->
      <div class="rounded-2xl border border-gray-800/80 bg-gray-950/50 backdrop-blur-sm p-4">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/15 shrink-0">
            <UIcon name="i-lucide-calendar-days" class="size-5 text-emerald-400" />
          </div>
          <div class="min-w-0">
            <span class="text-xs text-gray-400 block">Boekingen</span>
            <span class="block text-lg font-bold text-emerald-100 leading-tight">
              {{ upcomingCount }}
            </span>
          </div>
        </div>
      </div>

      <!-- Credits -->
      <div class="rounded-2xl border border-gray-800/80 bg-gray-950/50 backdrop-blur-sm p-4">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/15 shrink-0">
            <UIcon name="i-lucide-credit-card" class="size-5 text-emerald-400" />
          </div>
          <div class="min-w-0">
            <span class="text-xs text-gray-400 block">Credits</span>
            <span class="block text-lg font-bold text-emerald-100 leading-tight">
              {{ availableCredits }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="grid grid-cols-2 gap-4">
      <button
        aria-label="Stuur een bericht via Whatsapp"
        class="rounded-2xl border border-gray-800/80 bg-gray-950/50 backdrop-blur-sm p-4 flex items-center gap-3 text-left transition-colors hover:border-emerald-700/50 hover:bg-emerald-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        @click="askQuestion"
      >
        <div class="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/15 shrink-0" aria-hidden="true">
          <UIcon name="i-lucide-message-circle-more" class="size-5 text-emerald-400" />
        </div>
        <div class="min-w-0">
          <span class="text-xs text-gray-400 block">Hulp nodig?</span>
          <span class="text-sm font-semibold text-white leading-tight">Whatsapp</span>
        </div>
      </button>

      <button
        aria-label="Koop nieuwe credits"
        class="rounded-2xl border border-gray-800/80 bg-gray-950/50 backdrop-blur-sm p-4 flex items-center gap-3 text-left transition-colors hover:border-emerald-700/50 hover:bg-emerald-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        @click="showBuyCredits = true"
      >
        <div class="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/15 shrink-0" aria-hidden="true">
          <UIcon name="i-lucide-shopping-cart" class="size-5 text-emerald-400" />
        </div>
        <div class="min-w-0">
          <span class="text-xs text-gray-400 block">Meer lessen?</span>
          <span class="text-sm font-semibold text-white leading-tight">Koop credits</span>
        </div>
      </button>
    </div>

    <BuyCreditsModal v-model="showBuyCredits" />
  </div>
</template>
