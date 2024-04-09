<script setup lang="ts">
const title = ref('Yoga Ravennah | Login');
const description = ref('Om te kunnen boeken kun je een account aanmaken en inloggen');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/yoga/login');
const email = ref('');
const password = ref('');
const name = ref('');
const phone = ref('');
const registerForm = ref(false);
const passwordCheck = ref(false);

const store = useMainStore()
const { $rav } = useNuxtApp()
const { account, ID } = useAppwrite();

definePageMeta({
  layout: 'yoga'
})

useHead({
  title,
  meta: [
    {hid: 'description', name: 'description', content: description},
    {hid: 'og:title', property: 'og:title', content: title},
    {hid: 'og:url', property: 'og:url', content: pageUrl},
    {hid: 'og:description', property: 'og:description', content: description},
    {hid: 'og:image', property: 'og:image', content: ogImage},

    // twitter card
    {hid: "twitter:title", name: "twitter:title", content: title},
    {hid: "twitter:url", name: "twitter:url", content: pageUrl},
    {hid: 'twitter:description', name: 'twitter:description', content: description},
    {hid: "twitter:image", name: "twitter:image", content: ogImage},
    ]
})

const errorMessage = computed(() => store.errorMessage);
const isLoading = computed(() => store.isLoading);

async function login() {
    store.setError('')
    store.setLoading(true)
    try {
      await account.createEmailSession(email.value, password.value);
      store.getUser()
      store.setLoading(false)
      await navigateTo({ path: "/yoga/account" })
    } catch (error) {
        store.setLoading(false)
        store.setError('Er is iets verkeerd gegaan')
        console.error("Login failed:", error);
    }
}

async function register() {
    try {
      await store.registerUser(
            email.value,
            password.value,
            name.value,
            phone.value ? formatPhoneNumber(phone.value) : ''
        )
      await navigateTo({ path: "/yoga/account" })
    } catch (error) {
        console.error("Registration failed:", error);
    }
}

function formatPhoneNumber(input: string) {
    let digits = input.replace(/\D/g, '');
    if (digits.startsWith('06')) {
        digits = '31' + digits.substring(1);
    }
    if (!/^31[0-9]{9}$/.test(digits)) {
        console.log('Invalid phone number format');
    }
    return `+${digits}`;
}

const passwordStrength = computed(() => {
  let res = ''
  if(password.value) {
    if(password.value.length < 8 ) {
      res = 'Minimaal 8 tekens'
    } else {
      res = password.value ? 'Veilig wachtwoord' : ''
      passwordCheck.value = true
    }
  }
  return res
})
</script>

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
          <div v-if="passwordStrength" class="mt-3">
            <svg v-if="passwordStrength == 'Veilig wachtwoord'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 stroke-green-600 inline-block">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>

            <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 stroke-red-600 inline-block">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span class="ml-2" :class="passwordStrength == 'Veilig wachtwoord' ? 'text-green-600' : 'text-red-600'">{{ passwordStrength }} </span>
          </div>
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