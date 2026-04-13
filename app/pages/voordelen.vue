<script setup lang="ts">
const title = ref('Yoga Ravennah | Voordelen van Hatha Yoga');
const description = ref('Ontdek de vele voordelen van hatha yoga: minder stress, meer flexibiliteit, sterkere spieren, betere slaap en innerlijke rust. Voor iedereen, ook als beginner.');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/voordelen');

definePageMeta({
  // layout: 'yoga'
})

useHead({
  title,
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
</script>

<template>
  <div>

    <!-- HERO -->
    <Header image="/les-buiten.jpg" alignment="object-bottom">
      <h1 class="text-3xl md:text-6xl uppercase font-black">
        <span class="emerald-underline">Voordelen</span><span class="text-emerald-600">.</span>
      </h1>
      <p class="intro">
        Yoga is meer dan bewegen. Het is een manier om je lichaam én je hoofd te resetten — even weg van de drukte,
        terug bij jezelf. Hatha yoga geeft je concrete, voelbare resultaten, zowel fysiek als mentaal.
      </p>
      <div class="flex justify-start items-center gap-x-3 pt-2">
        <nuxt-link class="emerald button" to="/lessen">Bekijk het rooster</nuxt-link>
        <nuxt-link class="emerald-outlined button" to="/tarieven">Tarieven</nuxt-link>
      </div>
    </Header>

    <!-- BENEFIT CARDS GRID -->
    <div class="p-8 md:px-0 md:py-24">
      <div class="container mx-auto">
        <div class="text-center mb-12 space-y-4">
          <h2 class="text-2xl md:text-4xl uppercase font-black">
            <span class="emerald-underline">Wat levert het op</span><span class="text-emerald-600">.</span>
          </h2>
          <p class="intro max-w-xl mx-auto">
            Of je nu net begint of al jaren beweegt — hatha yoga heeft voor iedereen iets te bieden.
          </p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          <!-- Stressvermindering -->
          <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 hover:-translate-y-1 transition-transform duration-300">
            <div class="w-12 h-12 rounded-xl bg-emerald-900/50 flex items-center justify-center">
              <svg class="w-6 h-6 text-emerald-400 stroke-current" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold uppercase text-emerald-100">Minder stress</h3>
            <p class="text-emerald-200/70 text-base font-light leading-relaxed">
              Door bewust adem te halen en te bewegen, daalt je stressniveau merkbaar. Je zenuwstelsel komt tot rust en
              je hoofd leegt.
            </p>
          </div>

          <!-- Flexibiliteit -->
          <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 hover:-translate-y-1 transition-transform duration-300">
            <div class="w-12 h-12 rounded-xl bg-emerald-900/50 flex items-center justify-center">
              <svg class="w-6 h-6 text-emerald-400 stroke-current" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold uppercase text-emerald-100">Meer flexibiliteit</h3>
            <p class="text-emerald-200/70 text-base font-light leading-relaxed">
              Regelmatig stretchen maakt je lichaam soepeler. Spieren en gewrichten bewegen makkelijker, wat blessures
              helpt voorkomen.
            </p>
          </div>

          <!-- Spierversterking -->
          <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 hover:-translate-y-1 transition-transform duration-300">
            <div class="w-12 h-12 rounded-xl bg-emerald-900/50 flex items-center justify-center">
              <svg class="w-6 h-6 text-emerald-400 stroke-current" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold uppercase text-emerald-100">Sterkere spieren</h3>
            <p class="text-emerald-200/70 text-base font-light leading-relaxed">
              Yogahoudingen activeren diepe spiergroepen die je in de sportschool makkelijk overslaat. Resultaat: een
              sterker, evenwichtiger lichaam.
            </p>
          </div>

          <!-- Slaap -->
          <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 hover:-translate-y-1 transition-transform duration-300">
            <div class="w-12 h-12 rounded-xl bg-emerald-900/50 flex items-center justify-center">
              <svg class="w-6 h-6 text-emerald-400 stroke-current" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold uppercase text-emerald-100">Betere slaap</h3>
            <p class="text-emerald-200/70 text-base font-light leading-relaxed">
              Yoga kalmert het zenuwstelsel en bereidt je lichaam voor op rust. Veel beoefenaars slapen dieper en
              voelen zich uitgeruster.
            </p>
          </div>

          <!-- Balans & houding -->
          <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 hover:-translate-y-1 transition-transform duration-300">
            <div class="w-12 h-12 rounded-xl bg-emerald-900/50 flex items-center justify-center">
              <svg class="w-6 h-6 text-emerald-400 stroke-current" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v18m0-18C10.343 3 9 4.343 9 6s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3Zm0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3s4.5 4.03 4.5 9-2.015 9-4.5 9Z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold uppercase text-emerald-100">Balans & houding</h3>
            <p class="text-emerald-200/70 text-base font-light leading-relaxed">
              Balanceoefeningen trainen je stabiliteit en bewustzijn van je lichaam. Goed voor je houding, ook buiten de
              mat.
            </p>
          </div>

          <!-- Zelfbewustzijn -->
          <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 hover:-translate-y-1 transition-transform duration-300">
            <div class="w-12 h-12 rounded-xl bg-emerald-900/50 flex items-center justify-center">
              <svg class="w-6 h-6 text-emerald-400 stroke-current" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold uppercase text-emerald-100">Innerlijke rust</h3>
            <p class="text-emerald-200/70 text-base font-light leading-relaxed">
              Yoga nodigt je uit om in het moment te zijn. Je leert je gedachten en emoties opmerken zonder erdoor
              meegesleurd te worden.
            </p>
          </div>

        </div>
      </div>
    </div>

    <!-- PHYSICAL BENEFITS -->
    <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
      <div class="container mx-auto">
        <div class="md:flex justify-between items-center md:space-x-16 space-y-8 md:space-y-0">
          <div class="w-full md:w-1/2">
            <img
              class="w-full h-72 md:h-[28rem] object-cover object-center rounded-3xl shadow-xl"
              src="/flexibiliteit.jpg"
              alt="Yoga flexibiliteit oefening"
            />
          </div>
          <div class="w-full md:w-1/2 space-y-6">
            <h2 class="text-2xl md:text-4xl uppercase font-black text-emerald-900">
              <span class="emerald-underline">Fysieke voordelen</span><span class="text-emerald-600">.</span>
            </h2>
            <p class="intro intro-dark text-emerald-900">
              Hatha yoga is een volwaardige lichamelijke training. Je werkt aan kracht, lenigheid en coördinatie —
              zonder je lichaam te overbelasten.
            </p>
            <ul class="space-y-3">
              <li v-for="item in [
                'Verhoogde flexibiliteit in spieren en gewrichten',
                'Sterkere kern, rug en benen',
                'Verbeterde lichaamshouding',
                'Betere balans en coördinatie',
                'Meer energie door verbeterde ademhaling',
                'Minder kans op blessures en overbelasting',
              ]" :key="item" class="flex items-start space-x-3">
                <svg class="w-5 h-5 mt-0.5 shrink-0 text-emerald-600 stroke-current" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span class="text-emerald-900 text-base">{{ item }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- MENTAL BENEFITS -->
    <div class="p-8 md:px-0 md:py-24">
      <div class="container mx-auto">
        <div class="md:flex justify-between items-center md:space-x-16 space-y-8 md:space-y-0">
          <div class="w-full md:w-1/2 space-y-6 order-2 md:order-1">
            <h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline">Mentale voordelen</span><span class="text-emerald-600">.</span>
            </h2>
            <p class="intro">
              Het echte geheim van yoga zit van binnen. Een regelmatige beoefening verandert niet alleen hoe je
              beweegt, maar ook hoe je in het leven staat.
            </p>
            <ul class="space-y-3">
              <li v-for="item in [
                'Aantoonbare verlaging van stress en angstgevoelens',
                'Dieper en rustiger slapen',
                'Scherper focus en betere concentratie',
                'Meer emotionele veerkracht',
                'Groter zelfbewustzijn en zelfvertrouwen',
                'Gevoel van verbinding met je lichaam',
              ]" :key="item" class="flex items-start space-x-3">
                <svg class="w-5 h-5 mt-0.5 shrink-0 text-emerald-500 stroke-current" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span class="text-emerald-100 text-base">{{ item }}</span>
              </li>
            </ul>
          </div>
          <div class="w-full md:w-1/2 order-1 md:order-2">
            <img
              class="w-full h-72 md:h-[28rem] object-cover object-top rounded-3xl shadow-xl"
              src="/ravennah_staan.webp"
              alt="Yoga voor innerlijke rust"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- FOR EVERYONE -->
    <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
      <div class="container mx-auto">
        <div class="max-w-2xl mx-auto text-center space-y-8">
          <Yoga />
          <h2 class="text-2xl md:text-4xl uppercase font-black text-emerald-900">
            <span class="emerald-underline">Voor iedereen</span><span class="text-emerald-600">.</span>
          </h2>
          <p class="text-xl text-emerald-900 font-light leading-relaxed">
            Je hoeft geen ervaring te hebben, geen bijzondere conditie en zeker geen perfecte techniek. Yoga begint
            precies waar jij bent — in je eigen lijf, op dit moment.
          </p>
          <p class="text-xl text-emerald-900 font-light leading-relaxed">
            In de kleine groepslessen is er ruimte voor persoonlijke aandacht. Of je nu stijf bent als een plank of
            al een tijdje sport — iedereen is welkom en niemand wordt beoordeeld.
          </p>
          <blockquote class="border-l-4 border-emerald-600 pl-6 text-left italic text-emerald-800 text-lg">
            "Yoga is niet het doel. Yoga is de weg."
          </blockquote>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div class="p-8 md:px-0 md:py-24">
      <div class="container mx-auto">
        <div class="md:flex justify-between items-center md:space-x-16 space-y-8 md:space-y-0">
          <div class="w-full md:w-1/2">
            <img
              class="w-full h-72 md:h-96 object-cover object-center rounded-3xl shadow-xl"
              src="/yoga-sfeer.jpg"
              alt="Yoga les sfeer"
            />
          </div>
          <div class="w-full md:w-1/2 space-y-6">
            <h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline">Klaar om te beginnen</span><span class="text-emerald-600">?</span>
            </h2>
            <p class="intro">
              Ervaar zelf wat yoga met je doet. Plan een les in, kom langs in Rotterdam Nesselande en ontdek hoe je je
              na één les al beter kunt voelen.
            </p>
            <div class="flex flex-wrap gap-3">
              <nuxt-link class="emerald button" to="/lessen">Bekijk het rooster</nuxt-link>
              <nuxt-link class="emerald-outlined button" to="/over">Over Ravennah</nuxt-link>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
