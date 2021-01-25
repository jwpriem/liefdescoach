<template>
  <div class="md:h-screen p-8 pt-12 md:p-24 md:flex justify-between items-center md:space-x-16">
    <div class="w-full md:w-1/2 space-y-6">
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
        <div class="rose button">
          Meer weten?
        </div>
        <div class="gray button">
          Neem contact op
        </div>
      </div>
    </div>
    <img src="https://images.unsplash.com/photo-1527236438218-d82077ae1f85?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=934&q=80" class="h-96 mt-12 md:mt-0 md:h-full rounded-3xl w-full md:w-1/2 object-cover shadow-xl">
  </div>
</template>

<style lang="postcss" scoped>
.intro {
  @apply text-gray-800 text-lg font-light;
}
</style>
