<script lang="ts" setup>
const store = useMainStore()
const router = useRouter()
const navOpen = ref(false);

await useAsyncData('loggedInUser', () => Promise.all([store.getUser(), store.fetchLessons()]), {server: false})
const toggle = () => {
	navOpen.value = !navOpen.value;
};

const logout = async () => {
	try {
		await store.logoutUser();
		await router.push('/');
	} catch (error) {
		// Handle the error
	}
};

const loggedInUser = computed(() => store.loggedInUser)
</script>

<template>
	<div>
		<div
				class="block md:hidden flex justify-between items-center p-6 bg-gray-950"
		>
			<nuxt-link class="z-50" to="/">
				<Yoga color="#d1fae5"/>
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
							d="M4 6h16M4 12h16m-7 6h7"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
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
							d="M6 18L18 6M6 6l12 12"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
					/>
				</svg>
			</div>
			<div
					:class="navOpen ? 'left-0 ml-0' : 'ml-100vw'"
					class="transition-all duration-300 ease-in-out fixed top-0 bg-gray-950 min-h-screen flex justify-start items-center text-center z-40 w-screen"
			>
				<ul class="w-full space-y-8">
					<li @click="toggle">
						<nuxt-link class="mobile-nav-item" to="/">
							Home
						</nuxt-link>
					</li>
					<li @click="toggle">
						<nuxt-link class="mobile-nav-item" to="/over">
							Over mij
						</nuxt-link>
					</li>
					<li @click="toggle">
						<nuxt-link class="mobile-nav-item" to="/voordelen">
							Voordelen
						</nuxt-link>
					</li>
					<li @click="toggle">
						<nuxt-link class="mobile-nav-item" to="/lessen">
							Les schema
						</nuxt-link>
					</li>
					<li @click="toggle">
						<nuxt-link class="mobile-nav-item" to="/priveles">
							Priveles
						</nuxt-link>
					</li>
					<li @click="toggle">
						<nuxt-link class="mobile-nav-item" to="/hatha-yoga">
							Hatha Yoga
						</nuxt-link>
					</li>
					<li @click="toggle">
						<nuxt-link class="mobile-nav-item" to="/tarieven">
							Tarieven
						</nuxt-link>
					</li>
					<li @click="toggle">
						<nuxt-link class="mobile-nav-item" to="/contact">
							Contact
						</nuxt-link>
					</li>
					<li v-if="loggedInUser" @click="toggle">
						<nuxt-link class="mobile-nav-item" to="/account">
							{{ loggedInUser.name }}
						</nuxt-link>
					</li>
					<li v-else @click="toggle">
						<nuxt-link class="mobile-nav-item" to="/login">
							Login
						</nuxt-link>
					</li>
					<li v-if="loggedInUser" @click="toggle">
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
						<Yoga color="#d1fae5"/>
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