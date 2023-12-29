<template>
    <div>
      <Header image="/ravennah-yoga.jpg">
        <h1 class="text-3xl md:text-6xl uppercase font-black text-gray-800">
          <span class="pink-underline">Yoga</span><span class="text-rose-600">.</span>
        </h1>
        <p class="intro">
            Yoga, met name Yin en Hatha, biedt een uitgebreid scala aan fysieke en mentale voordelen die gunstig zijn voor je algehele welzijn. Deze yogastijlen hebben elk hun unieke kenmerken en benaderingen, maar ze delen de kernfilosofie van het in balans brengen van lichaam en geest.
        </p>
        <div>
          <p class="intro">
            Wil jij:
          </p>
          <ul class="intro">
            <li class="flex justify-start items-center space-x-3 cursor-pointer" @click="$lc.scrollTo('#weesJezelf')">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 inline-block stroke-current text-rose-600 animate-pulse">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
</svg>

              
              <p>Rust</p>
              <svg class="w-3 h-3 inline-block stroke-current" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </li>
            <li class="flex justify-start items-center space-x-3 cursor-pointer" @click="$lc.scrollTo('#onlineDating')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 inline-block stroke-current text-rose-600 animate-pulse">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
</svg>
              <p>Balans</p>
              <svg class="w-3 h-3 inline-block stroke-current" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </li>
            <li class="flex justify-start items-center space-x-3" @click="$lc.scrollTo('#twijfels')">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 inline-block stroke-current text-rose-600 animate-pulse">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
</svg>
              <p>Opladen</p>
              <svg class="w-3 h-3 inline-block stroke-current" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </li>
          </ul>
        </div>
        <div class="md:flex justify-start items-center md:space-x-3 space-y-2 md:space-y-0">
          <nuxt-link to="/intake" class="rose button">
            Les volgen?
          </nuxt-link>
          <nuxt-link to="/digitale-coach" class="gray button">
            Yoga bij bedrijven
          </nuxt-link>
        </div>
      </Header>
      <div class="bg-gray-100">
        <div id="weesJezelf" class="container mx-auto p-8 md:px-0 md:py-24">
          <div class="flex justify-center items-center">
            <div class="w-full md:w-1/2 md:text-center space-y-8">
              <h2 class="text-2xl md:text-4xl uppercase font-black text-gray-800">
                <span class="pink-underline">Stressvermindering</span><span class="text-rose-600">.</span>
              </h2>
              <p class="text-2xl">
                <span class="text-rose-600 font-bold">Yin</span> & <span class="text-rose-600 font-bold">Hatha</span> yoga moedigen diepe ademhaling en ontspanning aan, wat kan helpen stress te verminderen. Door je aandacht te richten op je ademhaling en het beoefenen van mindfulness, kun je kalmeren en innerlijke rust vinden.
              </p>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 inline-block stroke-current text-rose-600">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
</svg>
            </div>
          </div>
        </div>
      </div>
      <div class="p-8 md:px-0 md:py-24">
        <div class="container mx-auto">
          <div class="md:flex justify-between items-center md:space-x-12 space-y-8 md:space-y-0">
            <div class="w-full md:w-1/2">
              <img
                class="w-full h-64 md:h-96 object-center object-cover rounded-3xl shadow-xl"
                src="/flexibiliteit.jpg"
              >
            </div>
            <div id="onlineDating" class="w-full md:w-1/2 space-y-6">
              <h2 class="text-2xl md:text-4xl uppercase font-black text-gray-800">
                <span class="pink-underline">Flexibiliteit</span><span class="text-rose-600">.</span>
              </h2>
              <p class="intro">
                Yin yoga richt zich op het langdurig stretchen van spieren en bindweefsel, waardoor de flexibiliteit verbetert. Hatha yoga omvat houdingen en asana's die de mobiliteit van gewrichten vergroten en de spieren versterken.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="bg-rose-100 p-8 md:px-0 md:py-24">
        <div class="container mx-auto">
          <div id="twijfels" class="md:flex justify-between items-center md:space-x-12 space-y-8 md:space-y-0">
            <div class="w-full md:w-1/2 space-y-8">
              <h2 class="text-2xl md:text-4xl uppercase font-black text-gray-800">
                <span class="pink-underline">Alleen maar voordelen</span><span class="text-rose-600">.</span>
              </h2>
              <p class="intro">
                Al met al bieden Yin en Hatha yoga veel voordelen voor zowel je fysieke als mentale gezondheid. Het regelmatig beoefenen van deze yogastijlen kan een waardevolle aanvulling zijn op je levensstijl en bijdragen aan een gezonder en evenwichtiger leven.
              </p>
            </div>
            <div class="w-full md:w-1/2 space-y-6 text-center">
              <ul class="text-xl text-rose-600 italic font-light">
                <li>
                  Kracht & evenwicht
                </li>
                <li>
                    Verbeterde ademhaling
                </li>
                <li>
                    Verbeterde slaap
                </li>
              </ul>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 inline-block">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
</svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import Header from '@/components/Header'
  export default {
    components: {
      Header
    }
  }
  </script>
  