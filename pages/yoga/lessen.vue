<template>
  <div>
    <Header image="/yoga-sfeer2.jpg" alignment="object-bottom">
      <h1 class="text-3xl md:text-6xl uppercase font-black">
        <span class="emerald-underline">Les schema</span><span class="text-emerald-600">.</span>
      </h1>
      <p class="intro">
        <div v-for="lesson in upcomingLessons" :key="lesson">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
               stroke="currentColor" class="w-6 h-6 mr-1 inline-block stroke-current text-emerald-700">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
          </svg>
          {{ lesson }}
        </div>
      </p>
      <p class="intro">
        Boeken kan via <a href="https://www.instagram.com/yogaravennah" target="_blank"><u>Instagram</u></a> of <nuxt-link to="/yoga/contact"><u>contactformulier</u></nuxt-link>. Vul bij het bericht in welke datum je wilt boeken. Bekijk de <nuxt-link to="/yoga/tarieven"><u>tarieven</u></nuxt-link>. 
      </p>
      &nbsp;
      <p class="intro"><span
        class="text-emerald-700 text-xl md:text-2xl font-bold">Adres Studio YES Wellness</span><br>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mr-2 inline-block stroke-current text-emerald-700">
  <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
</svg>
Emmy van Leersumhof 24a
        Rotterdam (Nesselande)
      </p>

      <a class="intro" href="https://www.google.com/maps/place/Emmy+van+Leersumhof+24a,+3059+LT+Rotterdam/@51.9683125,4.585844,17z/data=!3m1!4b1!4m6!3m5!1s0x47c5cd7dec493187:0xd32480c3b7fa1581!8m2!3d51.9683092!4d4.5884189!16s%2Fg%2F11t40nxhs0?entry=ttu" target="_blank">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mr-2 inline-block stroke-current text-emerald-700">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
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
  data() {
    return {
      yogaLessons: [
        {day: 14, month: 1, year: 2024, startTime: "10", endTime: "11"},
        {day: 4, month: 2, year: 2024, startTime: "10", endTime: "11"},
        {day: 11, month: 2, year: 2024, startTime: "10", endTime: "11"},
        {day: 3, month: 3, year: 2024, startTime: "10", endTime: "11"},
        {day: 10, month: 3, year: 2024, startTime: "10", endTime: "11"}
      ]
    };
  },
  computed: {
    upcomingLessons() {
      const currentDate = new Date();
      return this.yogaLessons
        .filter(lesson => {
          const lessonDate = new Date(lesson.year, lesson.month - 1, lesson.day);
          return lessonDate >= currentDate;
        })
        .map(lesson => this.formatDateInDutch(lesson));
    }
  },
  methods: {
    formatDateInDutch(lesson) {
      dayjs.locale('nl'); // Set locale to Dutch

      const lessonDate = dayjs(new Date(lesson.year, lesson.month - 1, lesson.day));
      const formattedDate = lessonDate.format('dddd D MMMM');

      return `${formattedDate} van ${lesson.startTime} tot ${lesson.endTime} uur`;
    }
  }
}
</script>
