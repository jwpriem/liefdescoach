<template>
  <div>
    <Header>
      <h1 class="text-3xl md:text-6xl uppercase font-black text-gray-800">
        <span class="pink-underline">Liefdescoach</span><span class="text-rose-600">.</span>
      </h1>
      <p class="intro">
        Problemen in de liefde kennen we allemaal en soms hebben we iemand nodig die naar je luistert en je onafhankelijk adviseert. Dingen die je misschien niet direct van je vrienden of vriendinnen hoort.
      </p>
      <div>
        <p class="intro">
          Topics waar je aan kunt denken:
        </p>
        <ul class="intro">
          <li class="flex justify-start items-center space-x-3 cursor-pointer" @click="$lc.scrollTo('#weesJezelf')">
            <svg class="w-6 h-6 inline-block stroke-current text-rose-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="{2}" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            <p>Niet jezelf kunnen zijn</p>
            <svg class="w-3 h-3 inline-block stroke-current" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </li>
          <li class="flex justify-start items-center space-x-3 cursor-pointer" @click="$lc.scrollTo('#onlineDating')">
            <svg class="w-6 h-6 inline-block stroke-current text-rose-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="{2}" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            <p>(Online) dating</p>
            <svg class="w-3 h-3 inline-block stroke-current" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </li>
          <li class="flex justify-start items-center space-x-3" @click="$lc.scrollTo('#twijfels')">
            <svg class="w-6 h-6 inline-block stroke-current text-rose-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="{2}" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            <p>Twijfels over je relatie</p>
            <svg class="w-3 h-3 inline-block stroke-current" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </li>
        </ul>
      </div>
      <div class="md:flex justify-start items-center md:space-x-3 space-y-2 md:space-y-0">
        <nuxt-link to="/intake" class="rose button">
          Intake plannen?
        </nuxt-link>
        <nuxt-link to="/contact" class="gray button">
          Meer weten?
        </nuxt-link>
      </div>
    </Header>
    <div id="weesJezelf" class="container mx-auto p-8 md:px-0 md:py-24">
      <div class="flex justify-center items-center">
        <div class="w-full md:w-1/2 md:text-center space-y-8">
          <h2 class="text-2xl md:text-4xl uppercase font-black text-gray-800">
            <span class="pink-underline">Niet jezelf kunnen zijn</span><span class="text-rose-600">.</span>
          </h2>
          <p class="text-2xl">
            <span class="text-rose-600 font-bold">Gewoon jezelf zijn</span>. Dat klinkt zo makkelijk toch? Het is volgens bepaalde onderzoeken toch dé reden waarom relaties eindigen. Als één van de twee zichzelf niet kan zijn en het gevoel heeft zich anders voor te moeten doen om zo leuk gevonden te worden dan is dit extreem vermoeiend en onhoudbaar. Betekent dit dat als je jezelf blijft de kans op een goede relatie kleiner is?
          </p>
          <svg class="w-8 h-8 inline-block stroke-current text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="{2}" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
        </div>
      </div>
    </div>
    <div class="bg-gray-100 p-8 md:px-0 md:py-24">
      <div class="container mx-auto">
        <div class="md:flex justify-between items-center md:space-x-12 space-y-8 md:space-y-0">
          <div class="w-full md:w-1/2">
            <img
              class="w-full h-64 md:h-96 object-center object-cover rounded-3xl shadow-xl"
              src="https://images.unsplash.com/photo-1554774853-b415df9eeb92?ixlib=rb-1.2.1&ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&auto=format&fit=crop&w=1950&q=80
"
            >
          </div>
          <div id="onlineDating" class="w-full md:w-1/2 space-y-6">
            <h2 class="text-2xl md:text-4xl uppercase font-black text-gray-800">
              <span class="pink-underline">(Online) dating</span><span class="text-rose-600">.</span>
            </h2>
            <p class="intro">
              Vind je het eng of heb je er gewoon genoeg van omdat het maar niet lijkt te lukken? Er zijn talloze redenen om te beginnen maar ook om te stoppen met daten. Of dit nu online of offline is. Wat werkt er voor jou wel of niet?
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
              <span class="pink-underline">Twijfels over je relatie</span><span class="text-rose-600">.</span>
            </h2>
            <p class="intro">
              Soms lijkt het alsof je jezelf helemaal gek kunt maken met vragen. Zijn deze twijfels gegrond? Hoe ga je er mee om en hoe kom je hier achter?
            </p>
          </div>
          <div class="w-full md:w-1/2 space-y-6 text-center">
            <ul class="text-xl text-rose-600 italic font-light">
              <li>
                Vind hij/zij me aantrekkelijk genoeg?
              </li>
              <li>
                Waarom ben ik altijd degene die....
              </li>
              <li>
                Help! Ik ben jaloers, mag dat?
              </li>
            </ul>
            <svg class="w-10 h-10 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
