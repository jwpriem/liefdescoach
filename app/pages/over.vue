<script setup lang="ts">
const title = ref('Yoga Ravennah | Over mij');
const description = ref('Ik ben Ravennah Matser, yoga-instructeur in Rotterdam Nesselande. Ik geef laagdrempelige hatha yogalessen in kleine groepen, met veel ruimte voor jouw eigen tempo en persoonlijke groei.');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/over');

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
    <Header image="/ravennah-zwart.jpg" alignment="object-top">
      <h1 class="text-3xl md:text-6xl uppercase font-black">
        <span class="emerald-underline">Ravennah</span><span class="text-emerald-600">.</span>
      </h1>
      <p class="intro">
        Welkom! Ik ben Ravennah Matser — yoga-instructeur, moeder van twee, en iemand die gelooft dat iedereen
        recht heeft op even stilstaan. Ik geef hatha yogalessen in Rotterdam Nesselande voor mensen die
        willen bewegen, ademen en zichzelf terugvinden.
      </p>
      <div class="flex justify-start items-center gap-x-3 pt-2">
        <nuxt-link class="emerald button" to="/lessen">Bekijk het rooster</nuxt-link>
        <nuxt-link class="emerald-outlined button" to="/contact">Neem contact op</nuxt-link>
      </div>
    </Header>

    <!-- MY STORY -->
    <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
      <div class="container mx-auto">
        <div class="md:flex justify-between items-center md:space-x-16 space-y-8 md:space-y-0">
          <div class="w-full md:w-1/2 space-y-6">
            <h2 class="text-2xl md:text-4xl uppercase font-black text-emerald-900">
              <span class="emerald-underline">Mijn verhaal</span><span class="text-emerald-600">.</span>
            </h2>
            <p class="text-lg text-emerald-900 font-light leading-relaxed">
              Ik ben van nature een doorzetter. Als moeder, partner en workaholic stond mijn agenda altijd
              bomvol. Yoga leerde me iets wat geen agenda-app ooit kon: hoe je écht pauzeert.
            </p>
            <p class="text-lg text-emerald-900 font-light leading-relaxed">
              Wat begon als een manier om fysiek bij te blijven, groeide uit tot iets veel groters. Yoga gaf me
              niet alleen een sterker lichaam — het gaf me ook rust in mijn hoofd, meer geduld en een gezondere
              relatie met mezelf.
            </p>
            <p class="text-lg text-emerald-900 font-light leading-relaxed">
              Die transformatie wilde ik delen. Niet als strenge meester, maar als iemand die precies begrijpt
              hoe druk het leven kan zijn — en hoe waardevol het is om daar even uit te stappen.
            </p>
          </div>
          <div class="w-full md:w-1/2">
            <img
              class="w-full h-72 md:h-[30rem] object-cover object-center rounded-3xl shadow-xl"
              src="/ravennah-rug.jpg"
              alt="Ravennah in yogahouding"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- TEACHING APPROACH -->
    <div class="p-8 md:px-0 md:py-24">
      <div class="container mx-auto">
        <div class="md:flex justify-between items-center md:space-x-16 space-y-8 md:space-y-0">
          <div class="w-full md:w-1/2">
            <img
              class="w-full h-72 md:h-[30rem] object-cover object-top rounded-3xl shadow-xl"
              src="/priveles.jpeg"
              alt="Ravennah geeft yogales"
            />
          </div>
          <div class="w-full md:w-1/2 space-y-6">
            <h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline">Mijn aanpak</span><span class="text-emerald-600">.</span>
            </h2>
            <p class="intro">
              Geen prestatiedruk, geen oordeel. Mijn lessen zijn laagdrempelig en toegankelijk — voor beginners
              én voor mensen die al wat ervaring hebben.
            </p>
            <p class="text-lg text-emerald-100/80 font-light leading-relaxed">
              Ik werk bewust in kleine groepen zodat er ruimte is voor persoonlijke aandacht. Ik zie wie er voor
              me zit, wat iemand nodig heeft en pas de les daarop aan. Geen standaard script, maar een echte
              verbinding met de groep.
            </p>
            <ul class="space-y-3">
              <li v-for="item in [
                'Kleine groepen voor persoonlijke aandacht',
                'Toegankelijk voor alle niveaus',
                'Veilige, vertrouwde sfeer zonder taboes',
                'Focus op adem, beweging én bewustzijn',
                'Lessen in Rotterdam Nesselande',
              ]" :key="item" class="flex items-start space-x-3">
                <svg class="w-5 h-5 mt-0.5 shrink-0 text-emerald-500 stroke-current" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span class="text-emerald-100 text-base">{{ item }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- VALUES -->
    <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
      <div class="container mx-auto">
        <div class="text-center mb-12 space-y-4">
          <h2 class="text-2xl md:text-4xl uppercase font-black text-emerald-900">
            <span class="emerald-underline">Waar ik voor sta</span><span class="text-emerald-600">.</span>
          </h2>
          <p class="text-lg text-emerald-900 font-light max-w-xl mx-auto">
            Yoga is bij mij niet alleen lichamelijk bewegen. Het gaat over heel de mens.
          </p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div class="bg-white/60 rounded-2xl p-6 space-y-3 text-center">
            <div class="w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center mx-auto">
              <svg class="w-6 h-6 text-emerald-700 stroke-current" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            </div>
            <h3 class="text-base font-bold uppercase text-emerald-900">Oprechte aandacht</h3>
            <p class="text-emerald-800 text-sm font-light leading-relaxed">
              Ik zie je als mens, niet als deelnemer. Jouw welzijn staat centraal in elke les.
            </p>
          </div>
          <div class="bg-white/60 rounded-2xl p-6 space-y-3 text-center">
            <div class="w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center mx-auto">
              <svg class="w-6 h-6 text-emerald-700 stroke-current" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
              </svg>
            </div>
            <h3 class="text-base font-bold uppercase text-emerald-900">Geen oordeel</h3>
            <p class="text-emerald-800 text-sm font-light leading-relaxed">
              Of je nu stijf, onzeker of moe binnenkomt — iedereen is gelijkwaardig welkom op de mat.
            </p>
          </div>
          <div class="bg-white/60 rounded-2xl p-6 space-y-3 text-center">
            <div class="w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center mx-auto">
              <svg class="w-6 h-6 text-emerald-700 stroke-current" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            <h3 class="text-base font-bold uppercase text-emerald-900">Groei op jouw tempo</h3>
            <p class="text-emerald-800 text-sm font-light leading-relaxed">
              Yoga is geen wedstrijd. Ik begeleid je in jouw eigen ontwikkeling, stap voor stap.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- QUOTE + CTA -->
    <div class="p-8 md:px-0 md:py-24">
      <div class="container mx-auto">
        <div class="md:flex justify-between items-center md:space-x-16 space-y-8 md:space-y-0">
          <div class="w-full md:w-1/2 space-y-6">
            <h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline">Kom kennismaken</span><span class="text-emerald-600">.</span>
            </h2>
            <blockquote class="border-l-4 border-emerald-600 pl-6 italic text-emerald-200/80 text-xl font-light leading-relaxed">
              "Ik wil een plek creëren waar je jezelf kunt zijn. Geen masker, geen haast. Gewoon even helemaal aanwezig."
            </blockquote>
            <p class="intro">
              Benieuwd of mijn lessen iets voor jou zijn? Kom gerust een keer langs voor een proefles. Je bent altijd welkom.
            </p>
            <div class="flex flex-wrap gap-3">
              <nuxt-link class="emerald button" to="/lessen">Bekijk het rooster</nuxt-link>
              <nuxt-link class="emerald-outlined button" to="/contact">Stuur een bericht</nuxt-link>
            </div>
          </div>
          <div class="w-full md:w-1/2">
            <img
              class="w-full h-72 md:h-[30rem] object-cover object-center rounded-3xl shadow-xl"
              src="/ravennah-pose.jpg"
              alt="Ravennah yoga pose"
            />
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
