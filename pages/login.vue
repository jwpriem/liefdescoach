<script lang="ts" setup>
const title = ref('Yoga Ravennah | Login');
const description = ref('Om te kunnen boeken kun je een account aanmaken en inloggen');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/login');
const email = ref('');
const password = ref('');
const name = ref('');
const phone = ref('');
const dateOfBirth = ref('');
const injury = ref('');
const registerForm = ref(false);
const passwordCheck = ref(false);
const ready = ref(false)

// OTP state
const loginMode = ref<'password' | 'otp'>('password')
const otpStep = ref<'email' | 'code'>('email')
const otpCode = ref('')
const otpSent = ref(false)

const store = useMainStore()

definePageMeta({
  // layout: 'yoga',
  ssr: false
})

useHead({
  title,
  meta: [
    { hid: 'description', name: 'description', content: description },
    { hid: 'og:title', property: 'og:title', content: title },
    { hid: 'og:url', property: 'og:url', content: pageUrl },
    { hid: 'og:description', property: 'og:description', content: description },
    { hid: 'og:image', property: 'og:image', content: ogImage },

    // twitter card
    { hid: "twitter:title", name: "twitter:title", content: title },
    { hid: "twitter:url", name: "twitter:url", content: pageUrl },
    { hid: 'twitter:description', name: 'twitter:description', content: description },
    { hid: "twitter:image", name: "twitter:image", content: ogImage },
  ]
})

if (store.loggedInUser) {
  navigateTo('/yoga/account')
} else {
  // Otherwise, check session on the client and redirect if found
  onMounted(async () => {
    await store.getUser() // 401 => logged out (no banner)
    if (store.loggedInUser) {
      navigateTo('/yoga/account') // or '/account'
    }
  })
}

const errorMessage = computed(() => store.errorMessage);
const isLoading = computed(() => store.isLoading);
const normalizedEmail = computed(() => email.value.trim().toLowerCase())

const pageTitle = computed(() => {
  if (registerForm.value) return 'Account aanmaken'
  if (loginMode.value === 'otp') return 'Inloggen met e-mailcode'
  return 'Inloggen'
})

const pageSubtitle = computed(() => {
  if (registerForm.value) return 'Maak een account aan om lessen te boeken'
  if (loginMode.value === 'otp' && otpStep.value === 'code') return `We hebben een code gestuurd naar ${normalizedEmail.value}`
  if (loginMode.value === 'otp') return 'Ontvang een eenmalige code op je e-mailadres'
  return 'Welkom terug bij Yoga Ravennah'
})

async function login() {
  await store.login(normalizedEmail.value, password.value)

  if (store.loggedInUser) {
    await navigateTo({ path: "/yoga/account" })
  }
}

async function register() {
  await store.registerUser(
    normalizedEmail.value,
    password.value,
    name.value,
    phone.value ? formatPhoneNumber(phone.value) : '',
    dateOfBirth.value || null,
    injury.value || null
  )

  if (!store.errorMessage) {
    await navigateTo({ path: "/yoga/account" })
  }
}

async function sendOtp() {
  await store.sendOtp(normalizedEmail.value)

  if (!store.errorMessage) {
    otpStep.value = 'code'
    otpSent.value = true
  }
}

async function verifyOtp() {
  await store.verifyOtp(normalizedEmail.value, otpCode.value)

  if (store.loggedInUser) {
    await navigateTo({ path: '/yoga/account' })
  }
}

async function resendOtp() {
  otpCode.value = ''
  await store.sendOtp(normalizedEmail.value)
}

function switchToRegister() {
  loginMode.value = 'password'
  registerForm.value = true
  store.errorMessage = null
}

function switchLoginMode(mode: 'password' | 'otp') {
  loginMode.value = mode
  registerForm.value = false
  otpStep.value = 'email'
  otpCode.value = ''
  otpSent.value = false
  store.errorMessage = null
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
  if (password.value) {
    if (password.value.length < 8) {
      res = 'Minimaal 8 tekens'
    } else {
      res = password.value ? 'Veilig wachtwoord' : ''
      passwordCheck.value = true
    }
  }
  return res
})

onMounted(async () => {
  // Only now allow the form to render on the client
  ready.value = true
})
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4 pt-28 pb-12 sm:pt-32 sm:pb-20">
    <!-- Skeleton loader -->
    <div v-if="!ready" class="w-full max-w-md">
      <div class="animate-pulse space-y-6 rounded-2xl bg-gray-900/60 p-8">
        <div class="h-8 bg-gray-800 rounded-lg w-2/3"></div>
        <div class="h-4 bg-gray-800 rounded w-full"></div>
        <div class="h-12 bg-gray-800 rounded-lg"></div>
        <div class="h-12 bg-gray-800 rounded-lg"></div>
        <div class="h-12 bg-gray-800 rounded-lg w-1/2"></div>
      </div>
    </div>

    <!-- Main card -->
    <div v-else class="w-full max-w-md">
      <IsLoading :loading="isLoading"></IsLoading>

      <!-- Card container -->
      <div
        class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-8 sm:p-10">

        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-emerald-100 tracking-tight">{{ pageTitle }}</h1>
          <p class="mt-2 text-sm text-gray-400">{{ pageSubtitle }}</p>
        </div>

        <!-- Login mode toggle (only in login, not register) -->
        <div v-if="!registerForm" class="mb-8">
          <div class="flex rounded-xl bg-gray-800/60 p-1">
            <button class="flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200" :class="loginMode === 'password'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
              : 'text-gray-400 hover:text-gray-200'" @click="switchLoginMode('password')">
              Wachtwoord
            </button>
            <button class="flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200" :class="loginMode === 'otp'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
              : 'text-gray-400 hover:text-gray-200'" @click="switchLoginMode('otp')">
              E-mail code
            </button>
          </div>
        </div>

        <form @submit.prevent>
          <!-- Error message -->
          <div v-if="errorMessage" class="mb-6 rounded-xl bg-red-950/40 border border-red-800/50 p-4">
            <p class="text-sm text-red-300">{{ errorMessage }}</p>
            <button v-if="errorMessage?.includes('Maak eerst een account aan')"
              class="mt-2 text-sm font-medium text-red-200 underline underline-offset-2 hover:text-red-100 transition-colors"
              @click.prevent="switchToRegister">
              Registreren
            </button>
          </div>

          <!-- ==================== PASSWORD LOGIN / REGISTER ==================== -->
          <div v-if="loginMode === 'password' || registerForm" class="space-y-5">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-300 mb-1.5">
                E-mail <span class="text-red-500">*</span>
              </label>
              <UInput id="email" v-model="email" size="lg" color="primary" placeholder="naam@voorbeeld.nl" type="email"
                variant="outline" autocomplete="email" autocapitalize="none" autocorrect="off" inputmode="email" />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-300 mb-1.5">
                Wachtwoord <span class="text-red-500">*</span>
                <span v-if="registerForm" class="font-normal text-gray-500">(min. 8 tekens)</span>
              </label>
              <UInput id="password" v-model="password" size="lg" color="primary" placeholder="Je wachtwoord"
                type="password" variant="outline" />
            </div>

            <!-- Password strength indicator (register only) -->
            <div v-if="registerForm && passwordStrength" class="flex items-center gap-2">
              <svg v-if="passwordStrength === 'Veilig wachtwoord'" class="w-4 h-4 text-emerald-400 shrink-0" fill="none"
                stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                  stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <svg v-else class="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2"
                viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span class="text-xs"
                :class="passwordStrength === 'Veilig wachtwoord' ? 'text-emerald-400' : 'text-red-400'">
                {{ passwordStrength }}
              </span>
            </div>

            <!-- Name field (register only) -->
            <div v-if="registerForm">
              <label for="name" class="block text-sm font-medium text-gray-300 mb-1.5">
                Naam <span class="text-red-500">*</span>
              </label>
              <UInput id="name" v-model="name" size="lg" color="primary" placeholder="Je volledige naam"
                variant="outline" />
            </div>

            <!-- Phone field (register only) -->
            <div v-if="registerForm">
              <label for="phone" class="block text-sm font-medium text-gray-300 mb-1.5">
                Telefoonnummer <span class="text-gray-600 font-normal">(optioneel)</span>
              </label>
              <UInput id="phone" v-model="phone" size="lg" color="primary" placeholder="06 12345678"
                variant="outline" />
            </div>

            <!-- Date of birth field (register only) -->
            <div v-if="registerForm">
              <label for="dateOfBirth" class="block text-sm font-medium text-gray-300 mb-1.5">
                Geboortedatum <span class="text-gray-600 font-normal">(optioneel)</span>
              </label>
              <UInput id="dateOfBirth" v-model="dateOfBirth" type="date" size="lg" color="primary" variant="outline" />
            </div>

            <!-- Injury/good to know field (register only) -->
            <div v-if="registerForm">
              <label for="injury" class="block text-sm font-medium text-gray-300 mb-1.5">
                Blessures of bijzonderheden <span class="text-gray-600 font-normal">(optioneel)</span>
              </label>
              <UTextarea id="injury" v-model="injury" size="lg" color="primary" variant="outline"
                placeholder="Heb je blessures of zijn er andere dingen waar we rekening mee moeten houden?" />
            </div>
          </div>

          <!-- ==================== OTP LOGIN ==================== -->
          <div v-if="loginMode === 'otp' && !registerForm" class="space-y-5">
            <!-- Step 1: Enter email -->
            <template v-if="otpStep === 'email'">
              <div>
                <label for="otp-email" class="block text-sm font-medium text-gray-300 mb-1.5">
                  E-mail <span class="text-red-500">*</span>
                </label>
                <UInput id="otp-email" v-model="email" size="lg" color="primary" placeholder="naam@voorbeeld.nl"
                  type="email" variant="outline" autocomplete="email" autocapitalize="none" autocorrect="off"
                  inputmode="email" />
              </div>
            </template>

            <!-- Step 2: Enter code -->
            <template v-if="otpStep === 'code'">
              <div>
                <label for="otp-code" class="block text-sm font-medium text-gray-300 mb-1.5">
                  Verificatiecode <span class="text-red-500">*</span>
                </label>
                <UInput id="otp-code" v-model="otpCode" size="lg" color="primary" placeholder="000000" variant="outline"
                  autocomplete="one-time-code" inputmode="numeric"
                  :ui="{ base: 'text-center tracking-[0.3em] text-lg font-semibold' }" />
              </div>
            </template>
          </div>

          <!-- ==================== ACTION BUTTONS ==================== -->
          <div class="mt-8 space-y-3">
            <!-- Password login -->
            <template v-if="loginMode === 'password' && !registerForm">
              <UButton :disabled="!password" color="primary" variant="solid" size="lg" block @click="login">
                Inloggen
              </UButton>
              <div class="text-center">
                <button class="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
                  @click="registerForm = true">
                  Nog geen account? <span class="font-medium underline underline-offset-2">Registreren</span>
                </button>
              </div>
            </template>

            <!-- Register -->
            <template v-if="registerForm">
              <UButton :disabled="!password || !name" color="primary" variant="solid" size="lg" block @click="register">
                Account aanmaken
              </UButton>
              <div class="text-center">
                <button class="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
                  @click="registerForm = false">
                  Al een account? <span class="font-medium underline underline-offset-2">Inloggen</span>
                </button>
              </div>
            </template>

            <!-- OTP: send code -->
            <template v-if="loginMode === 'otp' && !registerForm && otpStep === 'email'">
              <UButton :disabled="!email" color="primary" variant="solid" size="lg" block @click="sendOtp">
                Verstuur code
              </UButton>
            </template>

            <!-- OTP: verify code -->
            <template v-if="loginMode === 'otp' && !registerForm && otpStep === 'code'">
              <UButton :disabled="!otpCode" color="primary" variant="solid" size="lg" block @click="verifyOtp">
                Verifieer en inloggen
              </UButton>
              <div class="text-center">
                <button class="text-sm text-gray-400 hover:text-emerald-400 transition-colors" @click="resendOtp">
                  Geen code ontvangen? <span class="font-medium underline underline-offset-2">Opnieuw versturen</span>
                </button>
              </div>
            </template>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
