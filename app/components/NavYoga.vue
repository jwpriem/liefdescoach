<script setup lang="ts">
const { user: loggedInUser, logout: authLogout } = useAuth()
const router = useRouter()
const navOpen = ref(false);
const { isNativeApp } = useNativeApp()

// Public pages before the offer menu, and after it; the app only shows the member pages
const LEADING_LINKS = [{ label: 'Home', to: '/' }]
const TRAILING_LINKS = [
	{ label: 'Over mij', to: '/over' },
	{ label: 'Tarieven', to: '/tarieven' },
	{ label: 'Contact', to: '/contact' },
]
const offerItems = OFFER_LINKS.map((offer) => ({ label: offer.name, icon: offer.icon, to: offer.path }))

// The schedule is for members: always in the app, on the website once logged in
const showSchedule = computed(() => isNativeApp.value || !!loggedInUser.value)

const mobileLinks = computed(() => [
	...(isNativeApp.value ? [] : [...LEADING_LINKS, { label: 'Aanbod', to: '/#aanbod' }, ...TRAILING_LINKS, { label: 'Sessie aanvragen', to: '/aanvraag' }]),
	...(showSchedule.value ? [{ label: 'Les schema', to: '/lessen' }] : []),
])

const toggle = () => {
	navOpen.value = !navOpen.value;
};

const logout = async () => {
	try {
		await authLogout();
		await router.push('/login');
	} catch (error) {
		// Handle the error
	}
};
</script>

<template>
	<div>
		<div class="block md:hidden flex justify-between items-center p-6 bg-gray-950"
			style="padding-top: max(env(safe-area-inset-top), 1.5rem)">
			<nuxt-link class="z-50" to="/">
				<Yoga color="#d1fae5" />
			</nuxt-link>
			<button class="bg-emerald-700 text-emerald-100 rounded-full h-12 w-12 flex justify-center items-center z-50 shadow-xl fixed right-0 m-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
				style="top: max(env(safe-area-inset-top), 0px)" @click="toggle" :aria-label="navOpen ? 'Sluit menu' : 'Open menu'">
				<svg v-if="!navOpen" class="w-6 h-6 inline-block stroke-current text-white" fill="none"
					stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path d="M4 6h16M4 12h16m-7 6h7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
				</svg>
				<svg v-if="navOpen" class="w-6 h-6 inline-block stroke-current text-white" fill="none"
					stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
				</svg>
			</button>
			<div :class="navOpen ? 'translate-x-0' : 'translate-x-full'"
				class="transition-transform duration-300 ease-in-out fixed top-0 left-0 bg-gray-950 min-h-screen flex justify-start items-center text-center z-40 w-screen">
				<ul class="w-full space-y-6">
					<li v-for="link in mobileLinks" :key="link.to">
						<nuxt-link class="mobile-nav-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-md px-2" :to="link.to" @click="toggle">
							{{ link.label }}
						</nuxt-link>
					</li>
					<li v-if="loggedInUser">
						<nuxt-link class="mobile-nav-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-md px-2" to="/account" @click="toggle">
							{{ loggedInUser.name }}
						</nuxt-link>
					</li>
					<li v-else>
						<nuxt-link class="mobile-nav-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-md px-2" to="/login" @click="toggle">
							Login
						</nuxt-link>
					</li>
					<li v-if="loggedInUser">
						<button class="mobile-nav-item cursor-pointer w-full text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded" @click="logout(); toggle()">
							Logout
						</button>
					</li>
				</ul>
			</div>
		</div>
		<nav class="hidden md:block w-full p-6 fixed z-50 top-0 left-0 bg-gray-950">
			<ul class="flex justify-center items-center space-x-10 text-lg text-emerald-100 uppercase font-light">
				<li>
					<nuxt-link to="/" class="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md p-1 block">
						<Yoga color="#d1fae5" />
					</nuxt-link>
				</li>
				<template v-if="!isNativeApp">
				<li v-for="link in LEADING_LINKS" :key="link.to">
					<nuxt-link class="nav-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md px-1" :to="link.to">
						{{ link.label }}
					</nuxt-link>
				</li>
				<li>
					<UDropdownMenu :items="offerItems" :content="{ align: 'start' }">
						<button class="nav-item uppercase cursor-pointer inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md px-1">
							Aanbod
							<UIcon name="i-lucide-chevron-down" class="w-4 h-4" />
						</button>
					</UDropdownMenu>
				</li>
				<li v-for="link in TRAILING_LINKS" :key="link.to">
					<nuxt-link class="nav-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md px-1" :to="link.to">
						{{ link.label }}
					</nuxt-link>
				</li>
				</template>
				<li v-if="showSchedule">
					<nuxt-link class="nav-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md px-1" to="/lessen">
						Les schema
					</nuxt-link>
				</li>
				<li v-if="loggedInUser">
					<nuxt-link class="nav-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md px-1" to="/account">
						{{ loggedInUser.name }}
					</nuxt-link>
				</li>
				<li v-else>
					<nuxt-link class="nav-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md px-1" to="/login">
						Login
					</nuxt-link>
				</li>
				<li v-if="loggedInUser">
					<button class="nav-item cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-2" @click="logout()">
						Logout
					</button>
				</li>
				<li v-if="!isNativeApp">
					<nuxt-link class="emerald button normal-case text-base" to="/aanvraag">
						Sessie aanvragen
					</nuxt-link>
				</li>
			</ul>
			<!--<a href="https://www.instagram.com/yogaravennah" target="_blank" class="fixed bottom-0 right-0 m-4 rounded-xl font-bold text-lg px-4 py-2 bg-emerald-700 text-white hover:bg-emerald-500 cursor-pointer inline-block transition-all duration-300 ease-in-out antialiased" >-->
			<!--  Boek een les via Instagram-->
			<!--</a>-->
		</nav>
	</div>
</template>