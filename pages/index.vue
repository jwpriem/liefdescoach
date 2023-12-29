<template>
  <div class="flex-none sm:flex flex-wrap min-h-screen">
    <div class="sm:w-1/2 w-full">
      <div
        class="bg-rose-50 h-full w-full p-20 min-height-50 flex justify-center items-center "
      >
      <div>
        <svg
          class="w-20 h-20 mb-3 inline-block stroke-current text-rose-600 animate-pulse"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="{2}"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <h2 class="text-2xl md:text-4xl uppercase font-black">Liefdescoach Ravennah</h2>
        <nuxt-link to="/liefdescoach" class="rose button mt-3"
          >Ga naar liefdescoach</nuxt-link
        >
      </div>
      </div>
    </div>
    <div class="sm:w-1/2 w-full bg-ravennah-yoga">
      <div
        class="dark-opacity h-full w-full p-20 min-height-50 flex justify-center items-center "
      >
        <div>
          <Yoga color="#d1fae5" />
          <h2
            class="text-2xl md:text-4xl uppercase font-black text-emerald-700"
          >
            Yoga Ravennah
          </h2>
          <nuxt-link to="/yoga" class="emerald button mt-3"
            >Ga naar yoga</nuxt-link
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Yoga from "@/components/Yoga";

export default {
  components: {
    Yoga
  }
};
</script>
