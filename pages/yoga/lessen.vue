<template>
  <div>
    <Header image="/yoga-sfeer2.jpg" alignment="object-bottom">
      <h1 class="text-3xl md:text-6xl uppercase font-black">
        <span class="emerald-underline">Les schema</span><span class="text-emerald-600">.</span>
      </h1>
      <p class="intro">
        <div v-for="lesson in upcomingLessons" :key="lesson.$id" v-if="lessons.length"
             class="flex content-center items-center gap-x-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
               stroke="currentColor" class="w-6 h-6 mr-1 inline-block stroke-current text-emerald-700">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
          </svg>
          {{ formatDateInDutch(lesson.date) }} ({{ lesson.spots }} plekken)
          <button :disabled="checkBooking(lesson.$id)" class="button emerald button-small"
                  :class="checkBooking(lesson.$id) ? 'disabled' : ''" @click="book(lesson)" v-if="loggedInUser">
                  <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block"
                 xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Boek
          </button>
          <span v-if="checkBooking(lesson.$id)" class="flex content-center"><svg xmlns="http://www.w3.org/2000/svg"
                                                                                 fill="none" viewBox="0 0 24 24"
                                                                                 stroke-width="1.5"
                                                                                 stroke="currentColor"
                                                                                 class="w-6 h-6 inline-block mx-2">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
              </svg>
            Geboekt
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
      &nbsp;
      <p class="intro"><span
        class="text-emerald-700 text-xl md:text-2xl font-bold">Adres Studio YES Wellness</span><br>
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
    </Header>
  </div>
</template>

<script>
import Header from '~/components/Header'
import dayjs from 'dayjs';
import 'dayjs/locale/nl';

export default {
  layout: 'yoga',
  components: {
    Header
  },
  async beforeCreate() {
    await this.$store.dispatch("getLessons");
  },
  computed: {
    upcomingLessons() {
      console.log(this.$store.getters.lessons)
      return this.$store.getters.lessons
        .filter(lesson => {
          const lessonDate = dayjs(new Date(lesson.date))
          return dayjs().isBefore(lessonDate)
        })
    },
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
    formatDateInDutch(lesson) {
      dayjs.locale('nl'); // Set locale to Dutch

      const lessonDate = dayjs(new Date(lesson))
      const formattedDate = lessonDate.format('dddd D MMMM')
      const startTime = lessonDate.format('h')
      const endTime = lessonDate.add(1, 'hour').format('h')

      return `${formattedDate} van ${startTime} tot ${endTime} uur`
    },
    checkBooking(id) {
      return this.$store.getters.myBookings.some(booking => booking.lessons.$id === id)
    },
    async book(lesson) {
      await this.$store.dispatch("handleBooking", {
        lesson: lesson,
        user: this.$store.getters.loggedInUser
      });

      await this.$store.dispatch('getAccountDetails', { route: this.$route.fullPath })
    }
  },
}
</script>
