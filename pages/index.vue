<template>
  <div>
    <Header>
      <h1 class="text-3xl md:text-6xl uppercase font-black text-gray-800 pink-underline">
        Liefdescoach<span class="text-rose-600">.</span>
      </h1>
      <p class="intro">
        Problemen in de liefde kennen we allemaal en soms hebben we gewoon iemand nodig die naar je luistert en je gewoon zegt waar het op staat. Dingen die je misschien niet direct van je vriendinnen hoort.
      </p>
      <div>
        <p class="intro">
          Topics waar je aan kunt denken:
        </p>
        <ul class="intro">
          <li class="flex justify-start items-center space-x-3">
            <svg class="w-6 h-6 inline-block stroke-current text-rose-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="{2}" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            <p>Niet jezelf kunnen zijn</p>
          </li>
          <li class="flex justify-start items-center space-x-3">
            <svg class="w-6 h-6 inline-block stroke-current text-rose-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="{2}" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            <p>(Online) dating</p>
          </li>
          <li class="flex justify-start items-center space-x-3">
            <svg class="w-6 h-6 inline-block stroke-current text-rose-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="{2}" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            <p>Twijfels over je relatie</p>
          </li>
        </ul>
      </div>
      <div class="md:flex justify-start items-center md:space-x-3 space-y-2 md:space-y-0">
        <nuxt-link to="/over" class="rose button">
          Meer weten?
        </nuxt-link>
        <nuxt-link to="/contact" class="gray button">
          Neem contact op
        </nuxt-link>
      </div>
    </Header>
    <div class="bg-gray-100 py-6 md:py-24">
      <div class="container mx-auto">
        <div class="md:flex justify-between items-center md:space-x-12">
          <div class="w-full md:w-1/2">
            <img
              class="w-full h-64 md:h-96 object-center object-cover rounded-3xl shadow-xl"
              src="https://images.unsplash.com/photo-1554774853-b415df9eeb92?ixlib=rb-1.2.1&ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&auto=format&fit=crop&w=1950&q=80
"
            >
          </div>
          <div class="w-full md:w-1/2 space-y-6">
            <h2 class="text-2xl md:text-4xl uppercase font-black text-gray-800 pink-underline">
              (Online) dating<span class="text-rose-600">.</span>
            </h2>
            <p class="intro">
              Vind je het eng of heb je er gewoon genoeg van omdat het maar niet lijkt te lukken? Er zijn talloze redenen om te beginnen maar ook om te stoppen met daten, of dit nu online of offline is. Wat werkt er voor jou wel of niet? En misschien wel het belangrijkste .... <span class="font-bold">waarom</span> dan wel of niet?
            </p>
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
