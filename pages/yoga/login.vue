<template>
  <div class="container mx-auto p-8 md:px-0 md:py-24">
    <IsLoading :loading="isLoading" />
    <form class="w-full sm:w-2/3 md:w-1/2 mx-auto my-12 md:my-24">
      <div class="mt-8 space-y-3 darkForm">
        <div v-if="errorMessage" class="p-4 border-red-600 border-2 bg-red-200 text-red-600 font-bold rounded">
          {{ errorMessage }}
        </div>
        <div>
          <div class="flex items-center justify-start">
            <label>E-mail</label> <sup class="required">*</sup>
          </div>
          <input id="email"
            v-model="email"
            type="text"
            placeholder="Je e-mailadres"
            class="w-full"
          />
        </div>
        <div>
          <div class="flex items-center justify-start">
            <label>Wachtwoord <span v-if="registerForm">(minimaal 8 characters)</span></label> <sup class="required">*</sup>
          </div>
          <input id="password"
            v-model="password"
            type="password"
            placeholder="Je wachtwoord"
            class="w-full"
          />
        </div>
        <div v-if="registerForm">
          <div class="flex items-center justify-start">
            <label>Naam</label> <sup class="required">*</sup>
          </div>
          <input id="name"
            v-model="name"
            type="text"
            placeholder="Je naam"
            class="w-full"
          />
        </div>
        <div v-if="registerForm">
          <div class="flex items-center justify-start">
            <label>Telefoonnummer</label>
          </div>
          <input id="phone"
            v-model="phone"
            type="text"
            placeholder="Je telefoonnummer"
            class="w-full"
          />
        </div>
      </div>
      <div class="mt-8">
        <span v-if="!registerForm" class="flex justify-start items-center gap-x-3">
          <button class="button emerald button-small" type="button" @click="login">
            Login
          </button>
          <span
            class="button button-small emerald-outlined"
            @click="registerForm = !registerForm"
          >
            Registreren
          </span>
        </span>
        <span v-else class="flex justify-start items-center gap-x-3">
          <button class="button button-small emerald" type="button" @click="register">
            Registeren
          </button>
          <span
            class="button button-small emerald-outlined"
            @click="registerForm = !registerForm"
          >
            Inloggen
          </span>
        </span>
      </div>
    </form>
  </div>
</template>

<script>
import { ref } from "vue";
import { account, ID } from "@/utils/appwrite.js";

export default {
  layout: "yoga",
  head() {
    return {
      title: this.pageTitle,
      meta:[
        { hid: 'description', name: 'description', content:  this.description },
        { hid: 'og:title', property: 'og:title', content: this.pageTitle },
        { hid: 'og:url', property: 'og:url', content: this.pageUrl },
        { hid: 'og:description', property: 'og:description', content: this.description },
        { hid: 'og:image', property: 'og:image', content: this.ogImage},

        // twitter card
        { hid: "twitter:title", name: "twitter:title", content: this.pageTitle },
        { hid: "twitter:url", name: "twitter:url", content: this.pageUrl },
        { hid: 'twitter:description', name: 'twitter:description', content: this.description },
        { hid: "twitter:image", name: "twitter:image", content: this.ogImage},
        ]
    }
  },
  data() {
    return {
      pageTitle: 'Yoga Ravennah | Login',
      description: 'Om te kunnen boeken kun je een account aanmaken en inloggen',
      ogImage: 'https://www.ravennah.com/ravennah-social.jpg',
      pageUrl: 'https://www.ravennah.com/yoga/login',
      email: '',
      password: '',
      name: '',
      phone: '',
      registerForm: false
    };
  },
  methods: {
    async login() {
      try {
        await this.$store.dispatch("loginUser", {
          email: this.email,
          password: this.password
        });
        
      } catch (error) {
        console.error("Login failed:", error);
      }
    },
    async register() {
      try {
        await this.$store.dispatch("registerUser", {
          email: this.email,
          password: this.password,
          name: this.name,
          phone: this.phone ? this.formatPhoneNumber(this.phone) : null
        });
      } catch (error) {
        console.error("Registration failed:", error);
      }
    },
    formatPhoneNumber(input) {
      // Remove all non-digit characters
      let digits = input.replace(/\D/g, '');

      // Check if the number starts with '06' and replace with '316'
      if (digits.startsWith('06')) {
        digits = '31' + digits.substring(1);
      }

      // Validate if the number is now in the correct format
      if (!/^31[0-9]{9}$/.test(digits)) {
        console.log('Invalid phone number format');
      }

      // Reconstruct the phone number with the country code +31
      return `+${digits}`;
    }
  },
  computed: {
    errorMessage() {
      return this.$store.getters.errorMessage;
    },
    isLoading() {
      return this.$store.getters.isLoading;
    }
  }
};
</script>
