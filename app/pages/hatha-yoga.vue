<script setup lang="ts">
const title = ref('Yoga Ravennah | Wat is Hatha Yoga?');
const description = ref('Hatha yoga is een klassieke yogastijl die lichaam en geest in balans brengt door houdingen, ademhaling en ontspanning. Perfect voor beginners en gevorderden in Rotterdam Nesselande.');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/hatha-yoga');

definePageMeta({
    // layout: 'yoga'
})

useHead({
    title,
    link: [
        { rel: 'canonical', href: pageUrl },
    ],
    meta: [
        {hid: 'description', name: 'description', content: description},
        {hid: 'og:title', property: 'og:title', content: title},
        {hid: 'og:url', property: 'og:url', content: pageUrl},
        {hid: 'og:description', property: 'og:description', content: description},
        {hid: 'og:image', property: 'og:image', content: ogImage},
        {hid: "twitter:title", name: "twitter:title", content: title},
        {hid: "twitter:url", name: "twitter:url", content: pageUrl},
        {hid: 'twitter:description', name: 'twitter:description', content: description},
        {hid: "twitter:image", name: "twitter:image", content: ogImage},
    ]
})

useLocalBusinessSchema()
</script>

<template>
  <div>

    <!-- HERO -->
    <Header image="/yoga-sfeer.jpg" alignment="object-center">
      <h1 class="text-3xl md:text-6xl uppercase font-black">
        <span class="emerald-underline">Hatha yoga</span><span class="text-emerald-600">.</span>
      </h1>
      <p class="intro">
        Hatha yoga is een van de oudste en meest beoefende yogastijlen ter wereld. Het combineert
        lichamelijke houdingen, bewuste ademhaling en ontspanning tot één geheel — rustgevend en
        tegelijkertijd krachtig.
      </p>
      <div class="flex justify-start items-center gap-x-3 pt-2">
        <nuxt-link class="emerald button" to="/lessen">Bekijk het rooster</nuxt-link>
        <nuxt-link class="emerald-outlined button" to="/voordelen">Voordelen</nuxt-link>
      </div>
    </Header>

    <!-- MEANING OF HATHA -->
    <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
      <div class="container mx-auto">
        <div class="md:flex justify-between items-center md:space-x-16 space-y-8 md:space-y-0">
          <div class="w-full md:w-1/2 space-y-6">
            <h2 class="text-2xl md:text-4xl uppercase font-black text-emerald-900">
              <span class="emerald-underline">De betekenis</span><span class="text-emerald-600">.</span>
            </h2>
            <p class="text-lg text-emerald-900 font-light leading-relaxed">
              Het woord <span class="font-bold text-emerald-700">Hatha</span> komt uit het Sanskrit en bestaat
              uit twee delen: <span class="font-bold">Ha</span> (zon) en <span class="font-bold">Tha</span> (maan).
              De zon staat voor energie, warmte en activiteit. De maan voor rust, koelte en reflectie.
            </p>
            <p class="text-lg text-emerald-900 font-light leading-relaxed">
              Hatha yoga brengt deze twee krachten in balans. Door bewust te bewegen én te ontspannen, vind
              je evenwicht — in je lichaam én in je hoofd. Dat is precies wat de lessen bij Ravennah bieden.
            </p>
            <div class="grid grid-cols-2 gap-4 pt-2">
              <div class="bg-emerald-200/60 rounded-xl p-4 text-center space-y-1">
                <p class="text-3xl font-black text-emerald-700">Ha</p>
                <p class="text-sm font-bold uppercase text-emerald-900">Zon</p>
                <p class="text-xs text-emerald-800 font-light">Energie · Warmte · Activiteit</p>
              </div>
              <div class="bg-emerald-200/60 rounded-xl p-4 text-center space-y-1">
                <p class="text-3xl font-black text-emerald-700">Tha</p>
                <p class="text-sm font-bold uppercase text-emerald-900">Maan</p>
                <p class="text-xs text-emerald-800 font-light">Rust · Koelte · Reflectie</p>
              </div>
            </div>
          </div>
          <div class="w-full md:w-1/2">
            <img
              class="w-full h-72 md:h-[30rem] object-cover object-center rounded-3xl shadow-xl"
              src="/ravennah_wind.webp"
              alt="Hatha yoga beweging"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- WHAT HAPPENS IN CLASS -->
    <div class="p-8 md:px-0 md:py-24">
      <div class="container mx-auto">
        <div class="md:flex justify-between items-center md:space-x-16 space-y-8 md:space-y-0">
          <div class="w-full md:w-1/2">
            <img
              class="w-full h-72 md:h-[30rem] object-cover object-center rounded-3xl shadow-xl"
              src="/warmingup.webp"
              alt="Warming up tijdens yogales"
            />
          </div>
          <div class="w-full md:w-1/2 space-y-6">
            <h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline">Wat gebeurt er in een les</span><span class="text-emerald-600">?</span>
            </h2>
            <p class="intro">
              Elke les is anders, maar heeft altijd een herkenbare opbouw. Je hoeft niets te weten of kunnen —
              gewoon komen is genoeg.
            </p>
            <ol class="space-y-4">
              <li v-for="(step, index) in [
                { title: 'Landen', text: 'De les begint rustig. Je arriveert op je mat, sluit je ogen en richt je aandacht naar binnen. Even loslaten wat er buiten was.' },
                { title: 'Warming-up', text: 'Zachte bewegingen om je lichaam wakker te maken. Gewrichten losdraaien, de wervelkolom mobiliseren, de adem verdiepen.' },
                { title: 'Asana\'s', text: 'We doorlopen een reeks yogahoudingen die kracht, flexibiliteit en balans combineren. Elke houding wordt rustig opgebouwd en gehouden.' },
                { title: 'Ontspanning', text: 'De les sluit af met een diepe ontspanning — savasana. Lichaam en geest integreren alles wat er is gedaan.' },
              ]" :key="step.title" class="flex items-start space-x-4">
                <div class="w-8 h-8 rounded-full bg-emerald-900 border border-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <span class="text-emerald-400 text-sm font-bold">{{ index + 1 }}</span>
                </div>
                <div>
                  <p class="font-bold text-emerald-300 uppercase text-sm">{{ step.title }}</p>
                  <p class="text-emerald-100/70 text-base font-light leading-relaxed">{{ step.text }}</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>

    <!-- HATHA VS OTHER STYLES -->
    <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
      <div class="container mx-auto">
        <div class="text-center mb-12 space-y-4">
          <h2 class="text-2xl md:text-4xl uppercase font-black text-emerald-900">
            <span class="emerald-underline">Hatha vs. andere stijlen</span><span class="text-emerald-600">.</span>
          </h2>
          <p class="text-lg text-emerald-900 font-light max-w-xl mx-auto">
            Er zijn tientallen yogastijlen. Hatha is de meest toegankelijke — rustig genoeg om te leren,
            uitdagend genoeg om te groeien.
          </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-emerald-600 rounded-2xl p-6 space-y-3 ring-2 ring-emerald-500">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold uppercase text-white">Hatha yoga</h3>
              <span class="text-xs font-bold uppercase bg-white/20 text-white px-2 py-1 rounded-full">Bij Ravennah</span>
            </div>
            <ul class="space-y-2">
              <li v-for="item in ['Rustig tempo', 'Houdingen worden gehouden', 'Focus op adem en bewustzijn', 'Ideaal voor beginners', 'Toegankelijk voor iedereen']" :key="item"
                class="flex items-center space-x-2 text-sm text-white/90">
                <svg class="w-4 h-4 shrink-0 text-white stroke-current" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>
          <div class="bg-white/50 rounded-2xl p-6 space-y-3">
            <h3 class="text-base font-bold uppercase text-emerald-900">Vinyasa yoga</h3>
            <ul class="space-y-2">
              <li v-for="item in ['Dynamisch en vloeiend', 'Houdingen stromen samen', 'Hogere intensiteit', 'Meer conditie vereist', 'Cardio-element aanwezig']" :key="item"
                class="flex items-center space-x-2 text-sm text-emerald-800">
                <svg class="w-4 h-4 shrink-0 text-emerald-600 stroke-current" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
                </svg>
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>
          <div class="bg-white/50 rounded-2xl p-6 space-y-3">
            <h3 class="text-base font-bold uppercase text-emerald-900">Yin yoga</h3>
            <ul class="space-y-2">
              <li v-for="item in ['Zeer langzaam tempo', 'Houdingen 3–5 minuten', 'Diep in bindweefsel', 'Passief en meditatief', 'Minder actieve spieren']" :key="item"
                class="flex items-center space-x-2 text-sm text-emerald-800">
                <svg class="w-4 h-4 shrink-0 text-emerald-600 stroke-current" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
                </svg>
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- FOR BEGINNERS -->
    <div class="p-8 md:px-0 md:py-24">
      <div class="container mx-auto">
        <div class="md:flex justify-between items-center md:space-x-16 space-y-8 md:space-y-0">
          <div class="w-full md:w-1/2 space-y-6">
            <h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline">Perfect voor beginners</span><span class="text-emerald-600">.</span>
            </h2>
            <p class="intro">
              Je hoeft nooit eerder yoga te hebben gedaan. Hatha yoga is bij uitstek geschikt als eerste
              kennismaking — het tempo is rustig genoeg om te leren en te begrijpen wat je doet.
            </p>
            <p class="text-lg text-emerald-100/80 font-light leading-relaxed">
              In de kleine groepen bij Ravennah is er altijd ruimte voor vragen en persoonlijke aanpassingen.
              Niemand verwacht dat je meteen de houding perfect uitvoert. Elke poging is goed.
            </p>
            <div class="bg-emerald-900/40 border border-emerald-800 rounded-2xl p-5 space-y-2">
              <p class="text-sm font-bold uppercase text-emerald-400">Wat neem je mee?</p>
              <ul class="space-y-1 text-emerald-100/80 text-base font-light">
                <li class="flex items-center space-x-2">
                  <span class="text-emerald-500">→</span><span>Comfortabele sportkleding</span>
                </li>
                <li class="flex items-center space-x-2">
                  <span class="text-emerald-500">→</span><span>Eventueel je eigen yogamat (of leen er een)</span>
                </li>
                <li class="flex items-center space-x-2">
                  <span class="text-emerald-500">→</span><span>Een flesje water</span>
                </li>
                <li class="flex items-center space-x-2">
                  <span class="text-emerald-500">→</span><span>Open houding — dat is alles</span>
                </li>
              </ul>
            </div>
          </div>
          <div class="w-full md:w-1/2">
            <img
              class="w-full h-72 md:h-[30rem] object-cover object-center rounded-3xl shadow-xl"
              src="/ravennah_side_plank.webp"
              alt="Yogahouding side plank"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
      <div class="container mx-auto">
        <div class="max-w-2xl mx-auto text-center space-y-8">
          <Yoga />
          <h2 class="text-2xl md:text-4xl uppercase font-black text-emerald-900">
            <span class="emerald-underline">Probeer het zelf</span><span class="text-emerald-600">.</span>
          </h2>
          <p class="text-xl text-emerald-900 font-light leading-relaxed">
            De enige manier om echt te weten of hatha yoga iets voor jou is, is door het te ervaren.
            Plan een les, rol je mat uit en ontdek wat het met je doet.
          </p>
          <div class="flex flex-wrap justify-center gap-3">
            <nuxt-link class="emerald button" to="/lessen">Bekijk het rooster</nuxt-link>
            <nuxt-link class="emerald-outlined button" to="/voordelen">Voordelen van yoga</nuxt-link>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
