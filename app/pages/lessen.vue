<script setup lang="ts">
const title = ref('Yoga Ravennah | Lessen');
const description = ref('Ik geef les elke zondag van 9.45u tot 10.45u bij Studio YES Wellness in Rotterdam Nesselande');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/lessen');

const { user: loggedInUser } = useAuth()
const { availableCredits } = useCredits()
const { myBookings } = useBookings()
const { handleBooking, cancelBooking, error: bookingError, pending: isLoading } = useBookingActions()
const { set: setOnBehalfOf } = useOnBehalfOf()
const toast = useToast()
const { $rav } = useNuxtApp()

definePageMeta({
})

useHead({
  title,
  meta: [
    { hid: 'description', name: 'description', content: description },
    { hid: 'og:title', property: 'og:title', content: title },
    { hid: 'og:url', property: 'og:url', content: pageUrl },
    { hid: 'og:description', property: 'og:description', content: description },
    { hid: 'og:image', property: 'og:image', content: ogImage },

    // twitter card
    { hid: "twitter:title", name: "twitter:title", content: title },
    { hid: "twitter:url", name: "twitter:url", content: pageUrl },
    { hid: 'twitter:description', name: 'twitter:description', content: description },
    { hid: "twitter:image", name: "twitter:image", content: ogImage },
  ]
})

const { data: lessons } = await useAsyncData('lessons', () => $fetch('/api/lessons'))

// ⚡ Bolt: Optimize O(N) array lookup in v-for to O(1) Set lookup
const bookingByLessonId = computed(() => {
  const map = new Map<string, any>()
  for (const booking of myBookings.value) {
    if (booking.lessons?.$id && !map.has(booking.lessons.$id)) {
      map.set(booking.lessons.$id, booking)
    }
  }
  return map
})

function checkBooking(id: string) {
  return bookingByLessonId.value.has(id)
}

const isCancelingId = ref<string | null>(null)

async function cancel(lesson: any) {
  if (!loggedInUser.value) return
  const booking = bookingByLessonId.value.get(lesson.$id)
  if (!booking) return

  isCancelingId.value = lesson.$id
  try {
    await cancelBooking(booking)
    if (!bookingError.value) {
      toast.add({
        id: 'cancellation',
        title: 'Boeking geannuleerd',
        icon: 'i-lucide-x-circle',
        color: 'primary',
        description: 'Je boeking is succesvol geannuleerd.'
      })
    }
  } finally {
    isCancelingId.value = null
  }
}

function spotsLeft(lesson: any) {
  return 9 - (lesson.bookings?.length || 0)
}

function spotsLabel(lesson: any) {
  const n = spotsLeft(lesson)
  return n === 1 ? '1 plek' : `${n} plekken`
}

function spotsBadgeClass(lesson: any) {
  const n = spotsLeft(lesson)
  if (n === 0) return 'bg-red-900/50 text-red-300'
  if (n <= 3) return 'bg-orange-900/50 text-orange-300'
  return 'bg-emerald-900/50 text-emerald-400'
}

async function book(lesson: any) {
  if (!loggedInUser.value) return
  setOnBehalfOf(loggedInUser.value)
  await handleBooking(lesson)

  if (!bookingError.value) {
    toast.add({
      id: 'booking',
      title: 'Tot snel',
      icon: 'i-lucide-badge-check',
      color: 'primary',
      description: 'Je les is geboekt!'
    })
  }
}

</script>

<template>
  <div>
    <IsLoading :loading="isLoading" />
    <Header image="/yoga-sfeer2.jpg" alignment="object-bottom" alt="Mensen in een yoga klas in de studio">
      <h1 class="text-3xl md:text-6xl uppercase font-black">
        <span class="emerald-underline">Les schema</span><span class="text-emerald-600">.</span>
      </h1>
      <!-- Lesson cards -->
      <div v-if="lessons && lessons.rows" class="space-y-3">
        <div v-for="lesson in lessons.rows" :key="lesson.$id"
          class="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">

          <!-- Card body -->
          <div class="p-4 space-y-3">
            <!-- Top row: icon + title + spots badge -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3 min-w-0">
                <!-- Guest lesson icon -->
                <svg v-if="lesson.type == 'guest lesson'" xmlns="http://www.w3.org/2000/svg" fill="none"
                  viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                  class="w-5 h-5 shrink-0 mt-0.5 text-emerald-500">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                </svg>
                <!-- Regular lesson icon -->
                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                  stroke="currentColor" class="w-5 h-5 shrink-0 mt-0.5 text-emerald-500">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
                </svg>
                <!-- Title -->
                <div class="min-w-0">
                  <p class="font-semibold leading-snug">
                    <nuxt-link v-if="lesson.type == 'hatha yoga'" to="/hatha-yoga">Hatha Yoga</nuxt-link>
                    <nuxt-link v-else-if="lesson.type == 'guest lesson'" to="/bo-bol">
                      <span v-html="$rav.getLessonDescription(lesson)" />
                    </nuxt-link>
                    <span v-else v-html="$rav.getLessonDescription(lesson)" />
                  </p>
                  <p class="text-sm text-white/50 mt-0.5">{{ $rav.formatDateInDutch(lesson.date, true) }}</p>
                </div>
              </div>
              <!-- Spots badge -->
              <span :class="spotsBadgeClass(lesson)"
                class="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
                {{ spotsLabel(lesson) }}
              </span>
            </div>

            <!-- Action row -->
            <div>
              <!-- Logged in, not booked, spots available -->
              <UTooltip v-if="loggedInUser && !checkBooking(lesson.$id) && spotsLeft(lesson) > 0"
                :text="availableCredits < 1 ? 'Onvoldoende credits' : 'Boek deze les'" class="block w-full">
                <div class="w-full">
                  <UButton block :disabled="availableCredits < 1" color="primary" variant="solid"
                    @click="book(lesson)">
                    {{ availableCredits < 1 ? 'Geen credits' : 'Boek les' }}
                  </UButton>
                </div>
              </UTooltip>
              <!-- Already booked -->
              <div v-else-if="checkBooking(lesson.$id)" class="space-y-2">
                <div class="flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-900/30 text-emerald-400 font-medium text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                    stroke="currentColor" class="w-5 h-5 shrink-0">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  Geboekt
                </div>
                <UTooltip :text="!$rav.checkCancelPeriod(lesson) ? 'Annuleren kan tot 24 uur voor de les' : 'Annuleer deze boeking'" class="block w-full">
                  <div class="w-full">
                    <UButton block :loading="isCancelingId === lesson.$id" :disabled="!$rav.checkCancelPeriod(lesson)" color="neutral" variant="ghost" size="sm" @click="cancel(lesson)">
                      Annuleer
                    </UButton>
                  </div>
                </UTooltip>
              </div>
              <!-- Logged in, not booked, lesson full -->
              <div v-else-if="loggedInUser && spotsLeft(lesson) === 0"
                class="flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 text-white/40 font-medium text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                  stroke="currentColor" class="w-5 h-5 shrink-0">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                Les is vol
              </div>
              <!-- Not logged in -->
              <UButton v-else-if="!loggedInUser" block color="primary" variant="solid" to="/login">
                Login om te boeken
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <p class="intro">
        <span v-if="!loggedInUser">Boeken kan door
          <nuxt-link to="/login"><u>in te loggen</u></nuxt-link>. Heb je nog geen account dan kun je een account
          aanmaken.</span>
        Bekijk ook de <nuxt-link to="/tarieven"><u>tarieven</u></nuxt-link>
      </p>

    </Header>

    <div class="bg-emerald-100 title-dark">
      <div id="weesJezelf" class="container mx-auto p-8 md:px-0 md:py-24">
        <div class="flex justify-center items-center">
          <div class="w-full md:w-2/3 md:text-center space-y-8">
            <h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline text-emerald-900">Waarom Yoga Ravennah</span><span
                class="text-emerald-700">.</span>
            </h2>
            <div class="text-xl text-emerald-900">
              <ol class="flex flex-col gap-y-3">
                <li><span class="text-emerald-700 font-bold">Laagdrempelige yoga:</span> Ik vind dat yoga voor iedereen
                  toegankelijk moet zijn. Of je nu een beginner bent of al ervaring hebt, mijn lessen zijn ontworpen om
                  je op je gemak te stellen en je te begeleiden bij elke stap van je yogareis.</li>
                <li><span class="text-emerald-700 font-bold">Ongedwongen en no-nonsense:</span> tijdens mijn les creëer
                  ik een ontspannen en informele sfeer waarin je jezelf kunt zijn. Geen oordeel, geen druk. Het is mijn
                  doel dat je geniet van de voordelen van yoga zonder de stress van prestatiedruk.</li>
                <li><span class="text-emerald-700 font-bold">Veel aandacht en ruimte:</span> De small group lessen
                  zorgen ervoor dat je de persoonlijke aandacht krijgt die je verdient. Als ervaren instructeur zal ik
                  je begeleiden en ondersteunen bij elke houding en ademhalingstechniek, zodat je het maximale uit elke
                  les kunt halen.</li>
                <li><span class="text-emerald-700 font-bold">Verbinding en gemeenschap:</span> In mijn lessen, hecht
                  veel waarde aan het creëren van een gemeenschap van gelijkgestemde mensen die samen groeien en leren.
                  Je zult je welkom voelen en nieuwe vriendschappen opbouwen terwijl je je yoga-avontuur voortzet.</li>
                <li class="mt-3">Dus, als je op zoek bent naar een plek waar je op je eigen tempo kunt kennismaken met
                  yoga, waar je jezelf kunt zijn en waar je kunt genieten van de voordelen van yoga in een
                  ondersteunende omgeving, dan ben je van harte welkom bij de mijn yogalessen.</li>
              </ol>
            </div>
            <Yoga />
          </div>
        </div>
      </div>
    </div>

    <div class="p-8 md:px-0 md:py-24">
      <div class="container mx-auto">
        <div class="md:flex justify-between items-center md:space-x-12 space-y-8 md:space-y-0">
          <div class="w-full md:w-1/2">
            <img class="w-full h-64 md:h-96 object-center object-cover rounded-3xl shadow-xl"
              src="/flexibiliteit.jpg" alt="Yoga docent Ravennah toont flexibiliteit in een vooroverbuiging" />
          </div>
          <div id="address" class="w-full md:w-1/2 space-y-6">
            <h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline">Studio YES Wellness</span><span class="text-emerald-700">.</span>
            </h2>
            <p class="intro">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                stroke="currentColor" class="w-6 h-6 mr-2 inline-block stroke-current text-emerald-700">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              Emmy van Leersumhof 24a
              Rotterdam (Nesselande)
            </p>

            <a class="intro"
              href="https://www.google.com/maps/place/Emmy+van+Leersumhof+24a,+3059+LT+Rotterdam/@51.9683125,4.585844,17z/data=!3m1!4b1!4m6!3m5!1s0x47c5cd7dec493187:0xd32480c3b7fa1581!8m2!3d51.9683092!4d4.5884189!16s%2Fg%2F11t40nxhs0?entry=ttu"
              target="_blank">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                stroke="currentColor" class="w-6 h-6 mr-2 inline-block stroke-current text-emerald-700">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
              </svg>
              <u>Bekijk op Google Maps</u>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>