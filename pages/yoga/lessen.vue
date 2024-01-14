<template>
  <div>
    <Header image="/yoga-sfeer2.jpg" alignment="object-bottom">
      <h1 class="text-3xl md:text-6xl uppercase font-black">
        <span class="emerald-underline">Les schema</span><span class="text-emerald-600">.</span>
      </h1>
      <p class="intro">
        <div v-for="lesson in upcomingLessons" :key="lesson">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
               stroke="currentColor" class="w-6 h-6 mr-2 inline-block stroke-current text-emerald-700">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
          </svg>
          {{ lesson }}
        </div>
      </p>
      <p class="intro">
        Boeken kan via <a href="https://www.instagram.com/yogaravennah" target="_blank"><u>Instagram</u></a> of <nuxt-link to="/yoga/contact"><u>contactformulier</u></nuxt-link>. Vul bij het bericht in welke datum je wilt boeken.
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
    </Header>
  </div>
</template>

<script>
import Header from '~/components/Header'

export default {
  layout: 'yoga',
  components: {
    Header
  },
  data() {
    return {
      yogaLessons: [
        {day: 14, month: 1, year: 2024, startTime: "10:00", endTime: "11:00"},
        {day: 1, month: 2, year: 2024, startTime: "10:00", endTime: "11:00"},
        {day: 11, month: 2, year: 2024, startTime: "10:00", endTime: "11:00"},
        {day: 3, month: 3, year: 2024, startTime: "10:00", endTime: "11:00"},
        {day: 10, month: 3, year: 2024, startTime: "10:00", endTime: "11:00"}
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
      const dutchMonthNames = ["januari", "februari", "maart", "april", "mei", "juni",
        "juli", "augustus", "september", "oktober", "november", "december"];
      const dutchDayNames = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];

      const date = new Date(lesson.year, lesson.month - 1, lesson.day);
      const dayName = dutchDayNames[date.getDay()];
      const monthName = dutchMonthNames[lesson.month - 1];

      return `${dayName} ${lesson.day} ${monthName} van ${lesson.startTime}u tot ${lesson.endTime}u`;
    }
  }
}
</script>
