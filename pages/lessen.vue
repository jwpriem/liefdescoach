<script setup lang="ts">
const title = ref('Yoga Ravennah | Lessen');
const description = ref('Ik geef les elke zondag van 9.45u tot 10.45u bij Studio YES Wellness in Rotterdam Nesselande');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/lessen');

const store = useMainStore()
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

const { data: lessons } = await useFetch('/api/lessons')

const loggedInUser = computed(() => store.loggedInUser);
const isLoading = computed(() => store.isLoading);
const availableCredits = computed(() => store.availableCredits);

function checkBooking(id: string) {
  return store.myBookings.some(booking => booking.lessons.$id === id)
}

async function book(lesson: any) {
  await store.setOnBehalfOf(store.loggedInUser)
  await store.handleBooking(lesson)

  let bookings = lesson.bookings?.length ? lesson.bookings.map(booking => booking.students.name + '\n').join('') : ''
  bookings = bookings + store.loggedInUser.name + '\n'

  await $fetch('/api/mail/send', {
    method: 'POST',
    body: {
      type: 'new-booking-notification',
      data: {
        name: store.loggedInUser.name,
        email: store.loggedInUser.email,
        lessonType: $rav.getLessonTitle(lesson),
        lessonDate: $rav.formatDateInDutch(lesson.date, true),
        spots: 9 - ((lesson.bookings?.length || 0) + 1),
        bookings,
      }
    }
  })

  toast.add({
    id: 'booking',
    title: 'Tot snel',
    icon: 'i-heroicons-check-badge',
    color: 'primary',
    description: 'Je les is geboekt!'
  })

  store.fetchLessons()
}

</script>

<template>
  <div>
    <IsLoading :loading="isLoading" />
    <Header image="/yoga-sfeer2.jpg" alignment="object-bottom">
      <h1 class="text-3xl md:text-6xl uppercase font-black">
        <span class="emerald-underline">Les schema</span><span class="text-emerald-600">.</span>
      </h1>
      <div class="intro">
        <div v-if="lessons && lessons.rows" v-for="lesson in lessons.rows" :key="lesson.$id"
          class="flex justify-between items-center gap-y-3 border-b py-3">
          <div>
            <div class="flex align-start items-center gap-x-3">
              <svg v-if="lesson.type == 'guest lesson'" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                class="w-6 shrink-0 h-6 mr-1 inline-block stroke-current text-emerald-700">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
              </svg>

              <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                stroke="currentColor" class="w-6 shrink-0 h-6 mr-1 inline-block stroke-current text-emerald-700">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span v-if="lesson.type == 'hatha yoga'">
                <nuxt-link to="/hatha-yoga">Hatha Yoga</nuxt-link>
              </span>
              <span v-else-if="lesson.type == 'guest lesson'">
                <nuxt-link to="/bo-bol"><span v-html="$rav.getLessonDescription(lesson)"></span></nuxt-link>
              </span>
              <span v-else v-html="$rav.getLessonDescription(lesson)"></span>
            </div>
            <p>{{ $rav.formatDateInDutch(lesson.date, true) }} ({{ 9 - (lesson.bookings?.length ||
              0) }}
              {{ (lesson.bookings?.length || 0) == 8 ?
                'plek' : 'plekken' }} )</p>
          </div>
          <div>
            <UButton :disabled="checkBooking(lesson.$id) || availableCredits < 1" color="primary" variant="solid" @click="book(lesson)"
              v-if="loggedInUser && !checkBooking(lesson.$id) && (lesson.bookings?.length || 0) != 9">{{ availableCredits < 1 ? 'Geen credits' : 'Boek' }}</UButton>
            <span v-if="checkBooking(lesson.$id)" class="flex content-center"><svg xmlns="http://www.w3.org/2000/svg"
                fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                class="w-6 h-6 inline-block mx-1">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Geboekt
            </span>
            <span v-if="loggedInUser && !checkBooking(lesson.$id) && (lesson.bookings?.length || 0) == 9"
              class="flex content-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                stroke="currentColor" class="w-6 h-6 inline-block mx-1">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              Helaas les is vol
            </span>
            <UButton color="primary" variant="solid" to="/login" v-if="!loggedInUser">Login om te boeken</UButton>
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
            <NuxtImg class="w-full h-64 md:h-96 object-center object-cover rounded-3xl shadow-xl"
              src="/flexibiliteit.jpg" />
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