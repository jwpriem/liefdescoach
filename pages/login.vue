<script lang="ts" setup>
const title = ref('Yoga Ravennah | Login');
const description = ref('Om te kunnen boeken kun je een account aanmaken en inloggen');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/login');
const email = ref('');
const password = ref('');
const name = ref('');
const phone = ref('');
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

async function login() {
	await store.login(normalizedEmail.value, password.value)

	if(store.loggedInUser) {
		await navigateTo({path: "/yoga/account"})
	}
}

async function register() {
	await store.registerUser(
    normalizedEmail.value,
		password.value,
		name.value,
		phone.value ? formatPhoneNumber(phone.value) : ''
	)

	if(!store.errorMessage) {
		await navigateTo({path: "/yoga/account"})
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
	await store.verifyOtp(otpCode.value)

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
  <div>
    <div v-if="!ready" class="container mx-auto p-8 md:px-0 md:py-24">
      <div class="animate-pulse space-y-4">
        <div class="h-6 bg-gray-800 rounded w-1/3"></div>
        <div class="h-10 bg-gray-800 rounded"></div>
        <div class="h-6 bg-gray-800 rounded w-1/3"></div>
        <div class="h-10 bg-gray-800 rounded"></div>
      </div>
    </div>

    <div v-else class="container mx-auto p-8 md:px-0 md:py-24">
      <IsLoading :loading="isLoading"></IsLoading>
      <form class="w-full sm:w-2/3 md:w-1/2 mx-auto my-12 md:my-24" @submit.prevent>

        <!-- Login mode tabs (only visible when not in register mode) -->
        <div v-if="!registerForm" class="flex gap-2 mb-6">
          <UButton
            :variant="loginMode === 'password' ? 'solid' : 'outline'"
            color="primary"
            @click="switchLoginMode('password')"
          >
            E-mail + Wachtwoord
          </UButton>
          <UButton
            :variant="loginMode === 'otp' ? 'solid' : 'outline'"
            color="primary"
            @click="switchLoginMode('otp')"
          >
            E-mail code
          </UButton>
        </div>

        <div class="mt-8 space-y-3 darkForm">
          <div v-if="errorMessage" class="p-4 border-red-600 border-2 bg-red-200 text-red-600 font-bold rounded">
            {{ errorMessage }}
            <button
              v-if="errorMessage?.includes('Maak eerst een account aan')"
              class="block mt-2 underline text-red-800"
              @click.prevent="switchToRegister"
            >
              Registreren
            </button>
          </div>

          <!-- ==================== PASSWORD LOGIN / REGISTER ==================== -->
          <template v-if="loginMode === 'password' || registerForm">
            <div>
              <div class="flex items-center justify-start">
                <label>E-mail</label> <sup class="required">*</sup>
              </div>
              <UInput id="email"
                      v-model="email"
                      color="primary"
                      placeholder="Je e-mailadres"
                      type="email"
                      variant="outline"
                      autocomplete="email"
                      autocapitalize="none"
                      autocorrect="off"
                      inputmode="email"/>
            </div>
            <div>
              <div class="flex items-center justify-start">
                <label>Wachtwoord <span v-if="registerForm">(minimaal 8 characters)</span></label> <sup class="required">*</sup>
              </div>
              <UInput id="password"
                      v-model="password"
                      color="primary"
                      placeholder="Je wachtwoord"
                      type="password"
                      variant="outline"/>
            </div>
            <div v-if="registerForm">
              <div v-if="passwordStrength" class="mt-3">
                <svg v-if="passwordStrength == 'Veilig wachtwoord'" class="w-6 h-6 stroke-green-600 inline-block" fill="none"
                     stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                      d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                      stroke-linecap="round"
                      stroke-linejoin="round"/>
                </svg>

                <svg v-else class="w-6 h-6 stroke-red-600 inline-block" fill="none" stroke="currentColor" stroke-width="1.5"
                     viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" stroke-linecap="round"
                        stroke-linejoin="round"/>
                </svg>
                <span :class="passwordStrength == 'Veilig wachtwoord' ? 'text-green-600' : 'text-red-600'" class="ml-2">{{
                    passwordStrength
                  }} </span>
              </div>
              <div class="flex items-center justify-start">
                <label>Naam</label> <sup class="required">*</sup>
              </div>
              <UInput id="name" v-model="name" color="primary" placeholder="Je naam" variant="outline"/>
            </div>
            <div v-if="registerForm">
              <div class="flex items-center justify-start">
                <label>Telefoonnummer</label>
              </div>
              <UInput id="phone" v-model="phone" color="primary" placeholder="Je telefoonnummer" variant="outline"/>
            </div>
          </template>

          <!-- ==================== OTP LOGIN ==================== -->
          <template v-if="loginMode === 'otp' && !registerForm">
            <!-- Step 1: Enter email -->
            <template v-if="otpStep === 'email'">
              <div>
                <div class="flex items-center justify-start">
                  <label>E-mail</label> <sup class="required">*</sup>
                </div>
                <UInput id="otp-email"
                        v-model="email"
                        color="primary"
                        placeholder="Je e-mailadres"
                        type="email"
                        variant="outline"
                        autocomplete="email"
                        autocapitalize="none"
                        autocorrect="off"
                        inputmode="email"/>
              </div>
              <p class="text-sm text-gray-400">
                We sturen een eenmalige code naar je e-mailadres waarmee je kunt inloggen.
              </p>
            </template>

            <!-- Step 2: Enter code -->
            <template v-if="otpStep === 'code'">
              <div class="p-3 bg-emerald-900/30 border border-emerald-700 rounded text-emerald-300 text-sm">
                Code verstuurd naar <strong>{{ normalizedEmail }}</strong>
              </div>
              <div>
                <div class="flex items-center justify-start">
                  <label>Code</label> <sup class="required">*</sup>
                </div>
                <UInput id="otp-code"
                        v-model="otpCode"
                        color="primary"
                        placeholder="Voer de 6-cijferige code in"
                        variant="outline"
                        autocomplete="one-time-code"
                        inputmode="numeric"/>
              </div>
            </template>
          </template>
        </div>

        <!-- ==================== ACTION BUTTONS ==================== -->
        <div class="mt-8">
          <span class="flex justify-start items-center gap-x-3">
            <!-- Password login buttons -->
            <template v-if="loginMode === 'password' && !registerForm">
              <UButton :disabled="!password" color="primary" variant="solid"
                       @click="login">Login</UButton>
              <UButton color="primary" variant="outline"
                       @click="registerForm = true">Registreren</UButton>
            </template>

            <!-- Register buttons -->
            <template v-if="registerForm">
              <UButton :disabled="!password" color="primary" variant="solid" @click="register">Registeren</UButton>
              <UButton color="primary" variant="outline"
                       @click="registerForm = false">Inloggen</UButton>
            </template>

            <!-- OTP buttons -->
            <template v-if="loginMode === 'otp' && !registerForm">
              <template v-if="otpStep === 'email'">
                <UButton :disabled="!email" color="primary" variant="solid"
                         @click="sendOtp">Verstuur code</UButton>
              </template>
              <template v-if="otpStep === 'code'">
                <UButton :disabled="!otpCode" color="primary" variant="solid"
                         @click="verifyOtp">Inloggen</UButton>
                <UButton color="primary" variant="ghost"
                         @click="resendOtp">Opnieuw versturen</UButton>
              </template>
            </template>
          </span>
        </div>
      </form>
    </div>
  </div>
</template>
