<template>
  <div>
    <div class="block md:hidden flex justify-between items-center p-6 bg-white">
      <nuxt-link to="/" class="z-50">
        <svg class="w-12 h-12 inline-block stroke-current text-rose-600 z-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="{2}" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
      </nuxt-link>
      <div class="bg-rose-600 text-white rounded-full h-12 w-12 flex justify-center items-center z-50 shadow-xl fixed top-0 right-0 m-6" @click="toggle">
        <svg
          v-if="!navOpen"
          class="w-6 h-6 inline-block stroke-current text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        ><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
        <svg
          v-if="navOpen"
          class="w-6 h-6 inline-block stroke-current text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        ><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </div>
      <div :class="navOpen ? 'left-0 ml-0' : 'ml-100vw'" class="transition-all duration-300 ease-in-out fixed top-0 bg-white min-h-screen flex justify-start items-center text-center z-40 w-screen">
        <ul class="w-full space-y-8">
          <li @click="toggle">
            <nuxt-link class="mobile-nav-item" to="/liefdescoach/">
              Home
            </nuxt-link>
          </li>
          <li @click="toggle">
            <nuxt-link class="mobile-nav-item" to="/liefdescoach/over">
              Over mij
            </nuxt-link>
          </li>
          <li @click="toggle">
            <nuxt-link class="mobile-nav-item" to="/liefdescoach/digitale-coach">
              Digitale coach
            </nuxt-link>
          </li>
          <li @click="toggle">
            <nuxt-link class="mobile-nav-item" to="/liefdescoach/kosten">
              Kosten
            </nuxt-link>
          </li>
          <li @click="toggle">
            <nuxt-link class="mobile-nav-item" to="/liefdescoach/oplichters">
              Oplichters
            </nuxt-link>
          </li>
          <li @click="toggle">
            <nuxt-link class="mobile-nav-item" to="/liefdescoach/contact">
              Contact
            </nuxt-link>
          </li>
          <li @click="toggle">
            <nuxt-link class="button rose" to="/liefdescoach/intake">
              Intake
            </nuxt-link>
          </li>
        </ul>
      </div>
    </div>
    <nav class="hidden md:block w-full p-6 fixed z-50 top-0 left-0 bg-white">
      <ul class="flex justify-center items-center space-x-10 text-lg text-gray-800 uppercase font-light">
        <li>
          <nuxt-link class="nav-item" to="/liefdescoach/">
            Home
          </nuxt-link>
        </li>
        <li>
          <nuxt-link class="nav-item" to="/liefdescoach/over">
            Over mij
          </nuxt-link>
        </li>
        <li>
          <nuxt-link to="/">
            <svg class="w-12 h-12 inline-block stroke-current text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="{2}" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </nuxt-link>
        </li>
        <li>
          <nuxt-link class="nav-item" to="/liefdescoach/kosten">
            Kosten
          </nuxt-link>
        </li>
        <li>
          <nuxt-link class="nav-item" to="/liefdescoach/oplichters">
            Oplichters
          </nuxt-link>
        </li>
        <li>
          <nuxt-link class="nav-item" to="/liefdescoach/contact">
            Contact
          </nuxt-link>
        </li>
      </ul>
      <nuxt-link class="fixed bottom-0 right-0 m-4 rounded-xl font-bold text-lg px-4 py-2 bg-rose-600 text-white hover:bg-rose-500 cursor-pointer inline-block transition-all duration-300 ease-in-out antialiased" to="/liefdescoach/intake">
        Kennismaking
      </nuxt-link>
    </nav>
  </div>
</template>

<script>
export default {
  data () {
    return {
      navOpen: false
    }
  },
  methods: {
    toggle () {
      this.navOpen = !this.navOpen
    }
  }
}
</script>

<style lang="postcss" scoped>
.nav-item {
  @apply transition-all duration-300 ease-in-out antialiased;
  &:hover {
    @apply text-rose-800;
  }
}
.mobile-nav-item {
  @apply text-2xl;
}
.nav-item.nuxt-link-exact-active, .mobile-nav-item.nuxt-link-exact-active {
  @apply relative z-10 transition-all duration-300 ease-in-out antialiased;

  &:before {
    @apply absolute h-2.5 bottom-0 left-0 -ml-2 bg-rose-600 bg-opacity-25 z-0 block w-full;
    content: '';
  };
}
</style>
