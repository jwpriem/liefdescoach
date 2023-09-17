<template>
  <footer class="bg-rose-500 text-white p-8 md:px-0 md:py-12">
    <div class="container mx-auto">
      <div class="md:flex justify-between items-start space-y-8 md:space-y-0">
        <div class="w-full md:w-2/4">
          <svg class="w-12 h-12 block stroke-current text-white mb-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="{2}" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          <small>&copy; www.liefdes.coach</small>
        </div>
        <div class="w-full md:w-1/6">
          <h6 class="uppercase font-bold text-rose-900">
            Menu
          </h6>
          <ul class="font-light">
            <li>
              <nuxt-link to="/over">
                Over mij
              </nuxt-link>
            </li>
            <li>
              <nuxt-link to="/digitale-coach">
                Digitale coach
              </nuxt-link>
            </li>
            <li>
              <nuxt-link to="/kosten">
                Kosten
              </nuxt-link>
            </li>
            <li>
              <nuxt-link to="/oplichters">
                Oplichters
              </nuxt-link>
            </li>
            <li>
              <nuxt-link to="/contact">
                Contact
              </nuxt-link>
            </li>
          </ul>
        </div>
        <div class="w-full md:w-1/4">
          <h6 class="uppercase font-bold text-rose-900">
            Contact
          </h6>
          <ul>
            <li @click="track('phone')">
              <svg class="w-5 h-5 inline-block text-rose-900 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              <a href="tel:0647699709">06 47 69 97 09</a>
            </li>
            <li @click="track('email')">
              <svg class="w-5 h-5 inline-block text-rose-900 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <nuxt-link to="/contact">
                ravennah<svg class="w-4 h-4 inline-block stroke-current" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>liefdes.coach
              </nuxt-link>
            </li>
            <li @click="track('instagram')">
              <svg
                id="Layer_1"
                class="w-5 h-5 inline-block text-rose-900 mr-2"
                fill="currentColor"
                stroke="currentColor"
                data-name="Layer 1"
                viewBox="0 0 128 128"
                xmlns="http://www.w3.org/2000/svg"
              ><defs><style>.cls-1{fill:#881337;}</style></defs><title /><path class="cls-1" d="M83,23a22,22,0,0,1,22,22V83a22,22,0,0,1-22,22H45A22,22,0,0,1,23,83V45A22,22,0,0,1,45,23H83m0-8H45A30.09,30.09,0,0,0,15,45V83a30.09,30.09,0,0,0,30,30H83a30.09,30.09,0,0,0,30-30V45A30.09,30.09,0,0,0,83,15Z" /><path class="cls-1" d="M90.14,32a5.73,5.73,0,1,0,5.73,5.73A5.73,5.73,0,0,0,90.14,32Z" /><path class="cls-1" d="M64.27,46.47A17.68,17.68,0,1,1,46.6,64.14,17.7,17.7,0,0,1,64.27,46.47m0-8A25.68,25.68,0,1,0,90,64.14,25.68,25.68,0,0,0,64.27,38.47Z" /></svg>
              <a href="https://www.instagram.com/liefdescoachrotterdam" target="_blank">@liefdescoachrotterdam</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
</template>
<script>
export default {
  methods: {
    track (label) {
      this.$ga.event({
        eventCategory: 'actions',
        eventAction: 'click',
        eventLabel: label
      })
    }
  }
}
</script>
