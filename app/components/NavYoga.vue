<script lang="ts" setup>
const { user: loggedInUser, logout: authLogout } = useAuth()
const router = useRouter()
const navOpen = ref(false);

const toggle = () => {
	navOpen.value = !navOpen.value;
};

const logout = async () => {
	try {
		await authLogout();
		await router.push('/');
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
				<ul class="w-full space-y-8">
					<li>
						<nuxt-link class="mobile-nav-item" to="/" @click="toggle">
							Home
						</nuxt-link>
					</li>
					<li>
						<nuxt-link class="mobile-nav-item" to="/over" @click="toggle">
							Over mij
						</nuxt-link>
					</li>
					<li>
						<nuxt-link class="mobile-nav-item" to="/voordelen" @click="toggle">
							Voordelen
						</nuxt-link>
					</li>
					<li>
						<nuxt-link class="mobile-nav-item" to="/lessen" @click="toggle">
							Les schema
						</nuxt-link>
					</li>
					<li>
						<nuxt-link class="mobile-nav-item" to="/priveles" @click="toggle">
							Priveles
						</nuxt-link>
					</li>
					<li>
						<nuxt-link class="mobile-nav-item" to="/hatha-yoga" @click="toggle">
							Hatha Yoga
						</nuxt-link>
					</li>
					<li>
						<nuxt-link class="mobile-nav-item" to="/tarieven" @click="toggle">
							Tarieven
						</nuxt-link>
					</li>
					<li>
						<nuxt-link class="mobile-nav-item" to="/contact" @click="toggle">
							Contact
						</nuxt-link>
					</li>
					<li v-if="loggedInUser">
						<nuxt-link class="mobile-nav-item" to="/account" @click="toggle">
							{{ loggedInUser.name }}
						</nuxt-link>
					</li>
					<li v-else>
						<nuxt-link class="mobile-nav-item" to="/login" @click="toggle">
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
					<nuxt-link to="/">
						<Yoga color="#d1fae5" />
					</nuxt-link>
				</li>
				<li>
					<nuxt-link class="nav-item" to="/">
						Home
					</nuxt-link>
				</li>
				<li>
					<nuxt-link class="nav-item" to="/over">
						Over mij
					</nuxt-link>
				</li>
				<li>
					<nuxt-link class="nav-item" to="/lessen">
						Les schema
					</nuxt-link>
				</li>
				<li>
					<nuxt-link class="nav-item" to="/priveles">
						Priveles
					</nuxt-link>
				</li>
				<li>
					<nuxt-link class="nav-item" to="/hatha-yoga">
						Hatha Yoga
					</nuxt-link>
				</li>
				<li>
					<nuxt-link class="nav-item" to="/tarieven">
						Tarieven
					</nuxt-link>
				</li>
				<li>
					<nuxt-link class="nav-item" to="/voordelen">
						Voordelen
					</nuxt-link>
				</li>
				<li>
					<nuxt-link class="nav-item" to="/contact">
						Contact
					</nuxt-link>
				</li>
				<li v-if="loggedInUser">
					<nuxt-link class="nav-item" to="/account">
						{{ loggedInUser.name }}
					</nuxt-link>
				</li>
				<li v-else>
					<nuxt-link class="nav-item" to="/login">
						Login
					</nuxt-link>
				</li>
				<li v-if="loggedInUser">
					<button class="nav-item cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-2" @click="logout()">
						Logout
					</button>
				</li>
			</ul>
			<!--<a href="https://www.instagram.com/yogaravennah" target="_blank" class="fixed bottom-0 right-0 m-4 rounded-xl font-bold text-lg px-4 py-2 bg-emerald-700 text-white hover:bg-emerald-500 cursor-pointer inline-block transition-all duration-300 ease-in-out antialiased" >-->
			<!--  Boek een les via Instagram-->
			<!--</a>-->
		</nav>
	</div>
</template>