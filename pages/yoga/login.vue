<template>
  <div class="container mx-auto p-8 md:px-0 md:py-24">
    <form class="w-full sm:w-2/3 md:w-1/2 mx-auto my-12 md:my-24">
      <div class="mt-8 space-y-3 darkForm">
        <div v-if="errorMessage" class="p-4 border-red-600 border-2 bg-red-200 text-red-600 font-bold rounded">
          {{ errorMessage }}
        </div>
        <LCInput
          id="email"
          v-model="email"
          label="E-mail"
          :required="true"
          type="text"
          placeholder="Je e-mailadres"
          class="w-full"
        />
        <LCInput
          id="wachtwoord"
          v-model="password"
          label="Wachtwoord"
          :required="true"
          type="password"
          placeholder="Wachtwoord"
          class="w-full"
        />
        <LCInput
          id="naam"
          v-model="name"
          label="Naam"
          :required="true"
          type="text"
          placeholder="Je naam"
          class="w-full"
          v-if="registerForm"
        />
        <LCInput
          id="telefoon"
          v-model="phone"
          label="Telefoonnummer"
          :required="false"
          type="text"
          placeholder="Je telefoonnummer"
          class="w-full"
          v-if="registerForm"
        />
      </div>
      <div class="mt-8">
        <span v-if="!registerForm" class="flex justify-start items-center gap-x-3">
          <button class="button emerald" type="button" @click="login">
            <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Login
          </button>
          <p
            class="intro cursor-pointer underline"
            @click="registerForm = !registerForm"
          >
            Nog geen account? Klik om te registreren
          </p>
        </span>
        <span v-else class="flex justify-start items-center gap-x-3">
          <button class="button emerald" type="button" @click="register">
          <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 inline-block mx-2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>
            Register
          </button>
          <p
            class="intro cursor-pointer underline"
            @click="registerForm = !registerForm"
          >
            Al eeen account? Klik om in te loggen
          </p>
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

  data() {
    return {
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

        this.$router.push("/yoga/account");
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
