<template>
  <div>
    <Header>
      <h1 class="text-3xl md:text-6xl uppercase font-black text-gray-800">
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
