<template>
  <div>
    <div
      class="block md:hidden flex justify-between items-center p-6 bg-gray-950"
    >
      <nuxt-link to="/" class="z-50">
        <Yoga color="#d1fae5" />
      </nuxt-link>
      <div
        class="bg-emerald-700 text-emerald-100 rounded-full h-12 w-12 flex justify-center items-center z-50 shadow-xl fixed top-0 right-0 m-6"
        @click="toggle"
      >
        <svg
          v-if="!navOpen"
          class="w-6 h-6 inline-block stroke-current text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16m-7 6h7"
          />
        </svg>
        <svg
          v-if="navOpen"
          class="w-6 h-6 inline-block stroke-current text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
      <div
        :class="navOpen ? 'left-0 ml-0' : 'ml-100vw'"
        class="transition-all duration-300 ease-in-out fixed top-0 bg-gray-950 min-h-screen flex justify-start items-center text-center z-40 w-screen"
      >
        <ul class="w-full space-y-8">
          <li @click="toggle">
            <nuxt-link class="mobile-nav-item" to="/yoga/">
              Home
            </nuxt-link>
          </li>
          <li @click="toggle">
            <nuxt-link class="mobile-nav-item" to="/yoga/over">
              Over mij
            </nuxt-link>
          </li>
          <li @click="toggle">
            <nuxt-link class="mobile-nav-item" to="/yoga/voordelen">
              Voordelen
            </nuxt-link>
          </li>
          <li @click="toggle">
            <nuxt-link class="mobile-nav-item" to="/yoga/lessen">
              Lessen
            </nuxt-link>
          </li>
          <li @click="toggle">
            <nuxt-link class="mobile-nav-item" to="/yoga/tarieven">
              Tarieven
            </nuxt-link>
          </li>
          <li @click="toggle">
            <nuxt-link class="mobile-nav-item" to="/yoga/contact">
              Contact
            </nuxt-link>
          </li>
          <li @click="toggle" v-if="loggedInUser">
            <nuxt-link class="mobile-nav-item" to="/yoga/account">
              {{ loggedInUser.name }}
            </nuxt-link>
          </li>
          <li @click="toggle" v-else>
            <nuxt-link class="mobile-nav-item" to="/yoga/login">
              Login
            </nuxt-link>
          </li>
          <li @click="toggle" v-if="loggedInUser">
            <span class="mobile-nav-item cursor-pointer" @click="logout()">
              Logout
            </span>
          </li>
        </ul>
      </div>
    </div>
    <nav class="hidden md:block w-full p-6 fixed z-50 top-0 left-0 bg-gray-950">
      <ul
        class="flex justify-center items-center space-x-10 text-lg text-emerald-100 uppercase font-light"
      >
        <li>
          <nuxt-link to="/">
            <Yoga color="#d1fae5" />
          </nuxt-link>
        </li>
        <li>
          <nuxt-link class="nav-item" to="/yoga/">
            Home
          </nuxt-link>
        </li>
        <li>
          <nuxt-link class="nav-item" to="/yoga/over">
            Over mij
          </nuxt-link>
        </li>
        <li>
          <nuxt-link class="nav-item" to="/yoga/lessen">
            Lessen
          </nuxt-link>
        </li>
        <li>
          <nuxt-link class="nav-item" to="/yoga/tarieven">
            Tarieven
          </nuxt-link>
        </li>
        <li>
          <nuxt-link class="nav-item" to="/yoga/voordelen">
            Voordelen
          </nuxt-link>
        </li>
        <li>
          <nuxt-link class="nav-item" to="/yoga/contact">
            Contact
          </nuxt-link>
        </li>
        <li v-if="loggedInUser">
          <nuxt-link class="nav-item" to="/yoga/account">
            {{ loggedInUser.name }}
          </nuxt-link>
        </li>
        <li v-else>
          <nuxt-link class="nav-item" to="/yoga/login">
            Login
          </nuxt-link>
        </li>
        <li v-if="loggedInUser">
          <span class="nav-item cursor-pointer" @click="logout()">
            Logout
          </span>
        </li>
      </ul>
      <!--<a href="https://www.instagram.com/yogaravennah" target="_blank" class="fixed bottom-0 right-0 m-4 rounded-xl font-bold text-lg px-4 py-2 bg-emerald-700 text-white hover:bg-emerald-500 cursor-pointer inline-block transition-all duration-300 ease-in-out antialiased" >-->
      <!--  Boek een les via Instagram-->
      <!--</a>-->
    </nav>
  </div>
</template>

<script>
import Yoga from "/components/Yoga";

export default {
  components: {
    Yoga
  },
  data() {
    return {
      navOpen: false
    };
  },
  async beforeMount() {
    await this.$store.dispatch("getAccountDetails", {
      route: this.$route.fullPath
    });
  },
  methods: {
    toggle() {
      this.navOpen = !this.navOpen;
    },
    async logout() {
      try {
        await this.$store.dispatch("logoutUser");
        this.$router.push("/yoga");
      } catch (error) {
  
      }
    }
  },
  computed: {
    loggedInUser() {
      return this.$store.getters.loggedInUser;
    }
  }
};
</script>

<style lang="postcss" scoped>
.nav-item {
  @apply transition-all duration-300 ease-in-out antialiased;

  &:hover {
    @apply text-emerald-800;
  }
}

.mobile-nav-item {
  @apply text-2xl;
}

.nav-item.nuxt-link-exact-active,
.mobile-nav-item.nuxt-link-exact-active {
  @apply relative z-10 transition-all duration-300 ease-in-out antialiased;

  &:before {
    @apply absolute h-2.5 bottom-0 left-0 -ml-2 bg-emerald-700 bg-opacity-25 z-0 block w-full;
    content: "";
  }
}
</style>
