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
const loginMode = ref<'password' | 'otp' | 'forgot'>('password')
const otpStep = ref<'email' | 'code'>('email')
const otpCode = ref('')
const otpSent = ref(false)

const resetSent = ref(false)
const migrationResetSent = ref(false)

const { user, login: authLogin, sendOtp: authSendOtp, verifyOtp: authVerifyOtp, register: authRegister, requestPasswordReset: authRequestPasswordReset, pending } = useAuth()
const { call, error: errorMessage, pending: isLoading } = useApiCall()

definePageMeta({
  // layout: 'yoga',
  ssr: false,
  middleware: () => {
    const { user } = useAuth()
    if (user.value) {
      return navigateTo('/account')
    }
  }
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

onMounted(async () => {
  // useAuth's useAsyncData already started fetching immediately; wait for it
  // without triggering a redundant second request
  if (pending.value) {
    await new Promise<void>(resolve => {
      const stop = watch(pending, (v) => { if (!v) { stop(); resolve() } })
    })
  }
  if (user.value) {
    await navigateTo('/account', { replace: true })
  } else {
    ready.value = true
  }
})

const normalizedEmail = computed(() => email.value.trim().toLowerCase())

const pageTitle = computed(() => {
  if (registerForm.value) return 'Account aanmaken'
  if (loginMode.value === 'forgot') return 'Wachtwoord vergeten'
  if (loginMode.value === 'otp') return 'Inloggen met e-mailcode'
  return 'Inloggen'
})

const pageSubtitle = computed(() => {
  if (registerForm.value) return 'Maak een account aan om lessen te boeken'
  if (loginMode.value === 'forgot') return 'Ontvang een link om je wachtwoord te herstellen'
  if (loginMode.value === 'otp' && otpStep.value === 'code') return `We hebben een code gestuurd naar ${normalizedEmail.value}`
  if (loginMode.value === 'otp') return 'Ontvang een eenmalige code op je e-mailadres'
  return 'Welkom terug bij Yoga Ravennah'
})

async function login() {
  const result = await call(() => authLogin(normalizedEmail.value, password.value))

  if (result && typeof result === 'object' && 'reason' in result && result.reason === 'migration-reset-sent') {
    migrationResetSent.value = true
    return
  }

  if (user.value) {
    await navigateTo({ path: "/account" })
  }
}

async function register() {
  await call(() => authRegister(
    normalizedEmail.value,
    password.value,
    name.value,
    phone.value ? formatPhoneNumber(phone.value) : '',
    dateOfBirth.value || null,
    injury.value || null
  ))

  if (!errorMessage.value) {
    await navigateTo({ path: "/account" })
  }
}

async function sendOtp() {
  await call(() => authSendOtp(normalizedEmail.value))

  if (!errorMessage.value) {
    otpStep.value = 'code'
    otpSent.value = true
  }
}

async function verifyOtp() {
  await call(() => authVerifyOtp(normalizedEmail.value, otpCode.value))

  if (user.value) {
    await navigateTo({ path: '/account' })
  }
}

async function resendOtp() {
  otpCode.value = ''
  await call(() => authSendOtp(normalizedEmail.value))
}

async function requestReset() {
  await call(() => authRequestPasswordReset(normalizedEmail.value))
  if (!errorMessage.value) {
    resetSent.value = true
  }
}

function switchToRegister() {
  loginMode.value = 'password'
  registerForm.value = true
  errorMessage.value = null
}

function switchLoginMode(mode: 'password' | 'otp' | 'forgot') {
  loginMode.value = mode
  registerForm.value = false
  otpStep.value = 'email'
  otpCode.value = ''
  otpSent.value = false
  resetSent.value = false
  errorMessage.value = null
}

function handleSubmit() {
  if (migrationResetSent.value) return
  if (registerForm.value) return register()
  if (loginMode.value === 'password') return login()
  if (loginMode.value === 'otp' && otpStep.value === 'email') return sendOtp()
  if (loginMode.value === 'otp' && otpStep.value === 'code') return verifyOtp()
  if (loginMode.value === 'forgot' && !resetSent.value) return requestReset()
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

        <!-- Login mode toggle (only in login, not register, not forgot) -->
        <div v-if="!registerForm && loginMode !== 'forgot'" class="mb-8">
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

        <form @submit.prevent="handleSubmit">
          <!-- Error message -->
          <div v-if="errorMessage" class="mb-6 rounded-xl bg-red-950/40 border border-red-800/50 p-4">
            <p class="text-sm text-red-300">{{ errorMessage }}</p>
            <button v-if="errorMessage?.includes('Maak eerst een account aan')"
              type="button"
              class="mt-2 text-sm font-medium text-red-200 underline underline-offset-2 hover:text-red-100 transition-colors"
              @click.prevent="switchToRegister">
              Registreren
            </button>
          </div>

          <!-- ==================== MIGRATION RESET SENT ==================== -->
          <div v-if="migrationResetSent" class="rounded-xl bg-emerald-950/40 border border-emerald-800/50 p-4 text-center">
            <UIcon name="i-lucide-mail-check" class="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p class="text-sm text-emerald-200 mb-2">We hebben ons systeem geüpgraded.</p>
            <p class="text-sm text-emerald-200">Er is een e-mail verstuurd naar <strong>{{ normalizedEmail }}</strong> met instructies om een nieuw wachtwoord in te stellen.</p>
          </div>

          <!-- ==================== PASSWORD LOGIN / REGISTER ==================== -->
          <div v-if="!migrationResetSent && (loginMode === 'password' || registerForm)" class="space-y-5">
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
                type="password" variant="outline" autocomplete="current-password" />
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
                  class="text-center tracking-[0.3em] text-lg font-semibold" />
              </div>
            </template>
          </div>

          <!-- ==================== FORGOT PASSWORD ==================== -->
          <div v-if="loginMode === 'forgot'" class="space-y-5">
            <template v-if="!resetSent">
              <div>
                <label for="forgot-email" class="block text-sm font-medium text-gray-300 mb-1.5">
                  E-mail <span class="text-red-500">*</span>
                </label>
                <UInput id="forgot-email" v-model="email" size="lg" color="primary" placeholder="naam@voorbeeld.nl"
                  type="email" variant="outline" autocomplete="email" autocapitalize="none" autocorrect="off"
                  inputmode="email" />
              </div>
            </template>
            <template v-else>
              <div class="rounded-xl bg-emerald-950/40 border border-emerald-800/50 p-4 text-center">
                <UIcon name="i-lucide-mail-check" class="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p class="text-sm text-emerald-200">Als dit e-mailadres bij ons bekend is, ontvang je een e-mail om je wachtwoord te herstellen.</p>
              </div>
            </template>
          </div>

          <!-- ==================== ACTION BUTTONS ==================== -->
          <div v-if="!migrationResetSent" class="mt-8 space-y-3">
            <!-- Password login -->
            <template v-if="loginMode === 'password' && !registerForm">
              <UTooltip :text="!password ? 'Vul je wachtwoord in om in te loggen' : 'Inloggen'" class="block w-full">
                <div class="w-full">
                  <UButton :disabled="!password" color="primary" variant="solid" size="lg" block @click="login">
                    Inloggen
                  </UButton>
                </div>
              </UTooltip>
              <div class="text-center">
                <button type="button" class="text-sm text-gray-400 hover:text-emerald-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-2 py-0.5"
                  @click="switchLoginMode('forgot')">
                  Wachtwoord vergeten?
                </button>
              </div>
              <div class="text-center">
                <button type="button" class="text-sm text-gray-400 hover:text-emerald-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-2 py-0.5"
                  @click="registerForm = true">
                  Nog geen account? <span class="font-medium underline underline-offset-2">Registreren</span>
                </button>
              </div>
            </template>

            <!-- Register -->
            <template v-if="registerForm">
              <UTooltip :text="(!password || !name) ? 'Vul je naam en wachtwoord in om een account aan te maken' : 'Account aanmaken'" class="block w-full">
                <div class="w-full">
                  <UButton :disabled="!password || !name" color="primary" variant="solid" size="lg" block @click="register">
                    Account aanmaken
                  </UButton>
                </div>
              </UTooltip>
              <div class="text-center">
                <button type="button" class="text-sm text-gray-400 hover:text-emerald-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-2 py-0.5"
                  @click="registerForm = false">
                  Al een account? <span class="font-medium underline underline-offset-2">Inloggen</span>
                </button>
              </div>
            </template>

            <!-- OTP: send code -->
            <template v-if="loginMode === 'otp' && !registerForm && otpStep === 'email'">
              <UTooltip :text="!email ? 'Vul je e-mailadres in om een code te ontvangen' : 'Verstuur code'" class="block w-full">
                <div class="w-full">
                  <UButton :disabled="!email" color="primary" variant="solid" size="lg" block @click="sendOtp">
                    Verstuur code
                  </UButton>
                </div>
              </UTooltip>
            </template>

            <!-- OTP: verify code -->
            <template v-if="loginMode === 'otp' && !registerForm && otpStep === 'code'">
              <UTooltip :text="!otpCode ? 'Vul de code in om in te loggen' : 'Verifieer en inloggen'" class="block w-full">
                <div class="w-full">
                  <UButton :disabled="!otpCode" color="primary" variant="solid" size="lg" block @click="verifyOtp">
                    Verifieer en inloggen
                  </UButton>
                </div>
              </UTooltip>
              <div class="text-center">
                <button type="button" class="text-sm text-gray-400 hover:text-emerald-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-2 py-0.5" @click="resendOtp">
                  Geen code ontvangen? <span class="font-medium underline underline-offset-2">Opnieuw versturen</span>
                </button>
              </div>
            </template>

            <!-- Forgot password -->
            <template v-if="loginMode === 'forgot'">
              <UTooltip v-if="!resetSent" :text="!email ? 'Vul je e-mailadres in om een reset-link te ontvangen' : 'Verstuur reset-link'" class="block w-full">
                <div class="w-full">
                  <UButton :disabled="!email" color="primary" variant="solid" size="lg" block @click="requestReset">
                    Verstuur reset-link
                  </UButton>
                </div>
              </UTooltip>
              <div class="text-center">
                <button type="button" class="text-sm text-gray-400 hover:text-emerald-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-2 py-0.5"
                  @click="switchLoginMode('password')">
                  Terug naar inloggen
                </button>
              </div>
            </template>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
