<template>
  <div>
    <IsLoading :loading="isLoading" />
    <Header image="/yoga-sfeer2.jpg" alignment="object-bottom">
      <h1 class="text-3xl md:text-6xl uppercase font-black">
        <span class="emerald-underline">Les schema</span><span class="text-emerald-600">.</span>
      </h1>
      <p class="intro">
        <div v-for="lesson in $rav.upcomingLessons(lessons)" :key="lesson.$id" v-if="lessons.length"
             class="flex items-center gap-x-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
               stroke="currentColor" class="w-6 h-6 mr-1 inline-block stroke-current text-emerald-700">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
          </svg>
          <b>{{ $rav.formatDateInDutch(lesson.date, true) }} ({{ lesson.spots }} {{ lesson.spots == 1 ? 'plek' : 'plekken' }} )</b>
          <button :disabled="checkBooking(lesson.$id)" class="button emerald button-small"
                  :class="checkBooking(lesson.$id) ? 'disabled' : ''" @click="book(lesson)" v-if="loggedInUser && !checkBooking(lesson.$id) && lesson.spots > 0">
            Boek
          </button>
          <span v-if="checkBooking(lesson.$id)" class="flex content-center"><svg xmlns="http://www.w3.org/2000/svg"
                                                                                 fill="none" viewBox="0 0 24 24"
                                                                                 stroke-width="1.5"
                                                                                 stroke="currentColor"
                                                                                 class="w-6 h-6 inline-block mx-1">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
              </svg>
            Geboekt
          </span>
          <span v-if="loggedInUser && !checkBooking(lesson.$id) && lesson.spots == 0" class="flex content-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"class="w-6 h-6 inline-block mx-1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            Helaas les is vol
          </span>
          <nuxt-link to="/yoga/login" v-if="!loggedInUser" class="button button-small emerald">
            Login om te boeken
          </nuxt-link>
        </div>
      </p>
      <p class="intro">
        <span v-if="!loggedInUser">Boeken kan door
        <nuxt-link to="/yoga/login"><u>in te loggen</u></nuxt-link>. Heb je nog geen account dan kun je een account aanmaken.</span>
        Bekijk ook de <nuxt-link to="/yoga/tarieven"><u>tarieven</u></nuxt-link>
      </p>

    </Header>

    <div class="bg-emerald-100 title-dark">
      <div id="weesJezelf" class="container mx-auto p-8 md:px-0 md:py-24">
        <div class="flex justify-center items-center">
          <div class="w-full md:w-2/3 md:text-center space-y-8">
            <h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline text-emerald-900"
                >Waarom Yoga Ravennah</span
              ><span class="text-emerald-700">.</span>
            </h2>
            <p class="text-xl text-emerald-900">
              <ol class="flex flex-col gap-y-3">
                <li><span class="text-emerald-700 font-bold">Laagdrempelige yoga:</span> Ik vind dat yoga voor iedereen toegankelijk moet zijn. Of je nu een beginner bent of al ervaring hebt, mijn lessen zijn ontworpen om je op je gemak te stellen en je te begeleiden bij elke stap van je yogareis.</li>
                <li><span class="text-emerald-700 font-bold">Ongedwongen en no-nonsense:</span> tijdens mijn les creëer ik een ontspannen en informele sfeer waarin je jezelf kunt zijn. Geen oordeel, geen druk. Het is mijn doel dat je geniet van de voordelen van yoga zonder de stress van prestatiedruk.</li>
                <li><span class="text-emerald-700 font-bold">Veel aandacht en ruimte:</span> De small group lessen zorgen ervoor dat je de persoonlijke aandacht krijgt die je verdient. Als ervaren instructeur zal ik je begeleiden en ondersteunen bij elke houding en ademhalingstechniek, zodat je het maximale uit elke les kunt halen.</li>
                <li><span class="text-emerald-700 font-bold">Verbinding en gemeenschap:</span> In mijn lessen, hecht veel waarde aan het creëren van een gemeenschap van gelijkgestemde mensen die samen groeien en leren. Je zult je welkom voelen en nieuwe vriendschappen opbouwen terwijl je je yoga-avontuur voortzet.</li>
                <li class="mt-3">Dus, als je op zoek bent naar een plek waar je op je eigen tempo kunt kennismaken met yoga, waar je jezelf kunt zijn en waar je kunt genieten van de voordelen van yoga in een ondersteunende omgeving, dan ben je van harte welkom bij de mijn yogalessen.</li>
              </ol>
            </p>
            <Yoga />
          </div>
        </div>
      </div>
    </div>

    <div class="p-8 md:px-0 md:py-24">
      <div class="container mx-auto">
        <div
          class="md:flex justify-between items-center md:space-x-12 space-y-8 md:space-y-0"
        >
          <div class="w-full md:w-1/2">
            <img
              class="w-full h-64 md:h-96 object-center object-cover rounded-3xl shadow-xl"
              src="/flexibiliteit.jpg"
            />
          </div>
          <div id="onlineDating" class="w-full md:w-1/2 space-y-6">
            <h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline">Studio YES Wellness</span
              ><span class="text-emerald-700">.</span>
            </h2>
            <p class="intro">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                   class="w-6 h-6 mr-2 inline-block stroke-current text-emerald-700">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>
              </svg>
              Emmy van Leersumhof 24a
              Rotterdam (Nesselande)
            </p>

            <a class="intro"
               href="https://www.google.com/maps/place/Emmy+van+Leersumhof+24a,+3059+LT+Rotterdam/@51.9683125,4.585844,17z/data=!3m1!4b1!4m6!3m5!1s0x47c5cd7dec493187:0xd32480c3b7fa1581!8m2!3d51.9683092!4d4.5884189!16s%2Fg%2F11t40nxhs0?entry=ttu"
               target="_blank">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                   class="w-6 h-6 mr-2 inline-block stroke-current text-emerald-700">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"/>
              </svg>
              <u>Bekijk op Google Maps</u>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Header from '~/components/Header'
import dayjs from 'dayjs';
import 'dayjs/locale/nl';
const utc = require('dayjs/plugin/utc');

export default {
  layout: 'yoga',
  head() {
    return {
      title: this.pageTitle,
      meta:[
        { hid: 'description', name: 'description', content:  this.description },
        { hid: 'og:title', property: 'og:title', content: this.pageTitle },
        { hid: 'og:url', property: 'og:url', content: this.pageUrl },
        { hid: 'og:description', property: 'og:description', content: this.description },
        { hid: 'og:image', property: 'og:image', content: this.ogImage},

        // twitter card
        { hid: "twitter:title", name: "twitter:title", content: this.pageTitle },
        { hid: "twitter:url", name: "twitter:url", content: this.pageUrl },
        { hid: 'twitter:description', name: 'twitter:description', content: this.description },
        { hid: "twitter:image", name: "twitter:image", content: this.ogImage},
        ]
    }
  },
  data(){
    return {
      pageTitle: 'Yoga Ravennah | Lessen',
      description: 'Ik geef les elke zondag van 10.00u tot 11.00u bij Studio YES Wellness in Rotterdam Nesselande',
      ogImage: 'https://www.ravennah.com/ravennah-social.jpg',
      pageUrl: 'https://www.ravennah.com/yoga/lessen'
    }
  },
  components: {
    Header
  },
  async beforeCreate() {
    await this.$store.dispatch("getLessons");
  },
  computed: {
    lessons() {
      return this.$store.getters.lessons;
    },
    loggedInUser() {
      return this.$store.getters.loggedInUser;
    },
    isLoading() {
      return this.$store.getters.isLoading;
    }
  },
  methods: {
    checkBooking(id) {
      return this.$store.getters.myBookings.some(booking => booking.lessons.$id === id)
    },
    async book(lesson) {
      await this.$store.dispatch("handleBooking", {
        lesson: lesson,
        user: this.$store.getters.loggedInUser,
        formattedDate: this.$rav.formatDateInDutch(lesson.date)
      });

      await this.$store.dispatch('getAccountDetails', { route: this.$route.fullPath })
    }
  },
}
</script>
