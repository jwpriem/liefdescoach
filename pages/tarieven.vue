<script lang="ts" setup>
const title = ref('Yoga Ravennah | Tarieven');
const description = ref('Kies het abonnement dat bij jou past. Losse lessen, strippenkaarten of een introductieaanbod.');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/tarieven');

const store = useMainStore()

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

const loggedInUser = computed(() => store.loggedInUser);

const pricingPlans = [
	{
		name: 'Losse les',
		credits: '1 les',
		price: '€ 16,00',
		perClass: '€ 16,00',
		features: [
			'Volledige flexibiliteit',
			'Betaling aan de deur (contant)',
			'Geldig voor 1 les'
		],
		cta: 'Koop een credit',
		link: '/lessen',
		highlight: false
	},
	{
		name: 'Kleine kaart',
		credits: '5 lessen',
		price: '€ 72,50',
		perClass: '€ 14,50',
		features: [
			'3 maanden geldig',
			'Ideaal om te proberen',
			'Bespaar € 1,50 per les'
		],
		cta: 'Kies kaart',
		action: 'credit_5',
		highlight: false,
		tag: 'Probeer het uit'
	},
	{
		name: 'Strippenkaart',
		credits: '10 lessen',
		price: '€ 135,00',
		perClass: '€ 13,50',
		features: [
			'6 maanden geldig',
			'Voor regelmatige yogi\'s',
			'Bespaar € 2,50 per les'
		],
		cta: 'Kies kaart',
		action: 'credit_10',
		highlight: true,
		tag: 'Meest gekozen'
	},
	{
		name: 'Grote kaart',
		credits: '20 lessen',
		price: '€ 250,00',
		perClass: '€ 12,50',
		features: [
			'12 maanden geldig',
			'Maximale flexibiliteit',
			'Bespaar € 3,50 per les'
		],
		cta: 'Kies kaart',
		action: 'credit_20',
		highlight: false,
		tag: 'Meest voordelig',
		gold: true
	}
]

async function sendWhatsapp(plan: any) {
	window.location.href = `https://wa.me/+31647699709?text=Hi Ravennah, ik wil graag een ${plan.name.toLowerCase()} kopen t.w.v. ${plan.price} euro voor ${plan.credits}`
}

</script>

<template>
	<div class="min-h-screen bg-gray-950">
		<!-- Hero Section -->
		<div class="bg-emerald-900 text-white relative overflow-hidden pt-40">
			<div class="absolute inset-0 opacity-20">
				<img src="/ravennah-pose.jpg" class="w-full h-full object-cover" alt="Yoga Ravennah background">
			</div>
			<div class="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-900/90"></div>

			<div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
				<h1 class="text-4xl md:text-6xl font-black uppercase tracking-tight mb-4">
					Kies jouw <span class="text-emerald-400">ritme</span>.
				</h1>
				<p class="text-xl md:text-2xl text-emerald-100 max-w-2xl mx-auto font-light">
					Flexibele opties voor elke yogi. Van losse lessen tot voordelige strippenkaarten.
				</p>
			</div>
		</div>

		<!-- Pricing Grid -->
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

				<div v-for="plan in pricingPlans" :key="plan.name"
					class=" bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-8 sm:p-10 rounded-2xl shadow-xl overflow-hidden flex flex-col transition-transform hover:-translate-y-1 duration-300"
					:class="{ 'ring-2 ring-emerald-500': plan.highlight, 'ring-2 ring-yellow-500': plan.gold }">

					<!-- Badge -->
					<div v-if="plan.tag" class="text-xs font-bold uppercase tracking-wider text-center py-1.5"
						:class="plan.gold ? 'bg-yellow-100 text-yellow-800' : (plan.highlight ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600')">
						{{ plan.tag }}
					</div>
					<div v-else class="h-7 bg-transparent"></div>

					<div class="p-6 flex-grow flex flex-col">
						<h3 class="text-xl font-bold text-emerald-100 mb-2">{{ plan.name }}</h3>
						<div class="mb-4">
							<span class="text-3xl font-black text-emerald-100">{{ plan.price }}</span>
							<span v-if="plan.credits" class="text-emerald-500 text-sm font-medium block mt-1">{{
								plan.credits }}</span>
						</div>

						<div v-if="plan.perClass"
							class="mb-6 inline-block bg-emerald-500 rounded-lg px-3 py-1.5 self-start">
							<span class="text-sm font-medium text-emerald-50">
								<span class="font-bold text-emerald-900">{{ plan.perClass }}</span> / les
							</span>
						</div>

						<ul class="space-y-3 mb-8 flex-grow">
							<li v-for="feature in plan.features" :key="feature"
								class="flex items-start text-sm text-emerald-50">
								<svg class="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" fill="none"
									stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
										d="M5 13l4 4L19 7"></path>
								</svg>
								{{ feature }}
							</li>
						</ul>

						<div class="mt-auto">
							<button @click="sendWhatsapp(plan)"
								class="block w-full py-3 px-4 font-bold rounded-xl text-center transition-colors shadow-sm"
								:class="plan.gold ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'">
								{{ plan.cta }}
							</button>
						</div>
					</div>
				</div>

			</div>
		</div>

		<!-- Additional Info -->
		<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-16 text-center text-neutral-600">
			<h3 class="text-lg font-bold text-neutral-900 mb-4">Goed om te weten</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-neutral-600 text-sm text-left">
				<div
					class="bg-emerald-500 p-6 rounded-xl border border-emerald-400/50 backdrop-blur-sm shadow-2xl shadow-emerald-950/20">
					<svg class="w-6 h-6 text-emerald-900 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
					<h4 class="font-bold text-emerald-900 mb-2">Geldigheid</h4>
					<p class="text-emerald-950">Strippenkaarten hebben een vaste geldigheidsduur vanaf het moment van
						aankoop. Check de
						geldigheid per kaart.</p>
				</div>
				<div
					class="bg-emerald-500 p-6 rounded-xl border border-emerald-400/50 backdrop-blur-sm shadow-2xl shadow-emerald-950/20">
					<svg class="w-6 h-6 text-emerald-900 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z">
						</path>
					</svg>
					<h4 class="font-bold text-emerald-900 mb-2">Reserveren</h4>
					<p class="text-emerald-950">Met een account kun je eenvoudig lessen boeken en annuleren. Annuleren
						is kosteloos tot 24 uur
						van tevoren.</p>
				</div>
			</div>

			<p v-if="!loggedInUser" class="mt-8 text-emerald-500">
				Nog geen account? <nuxt-link to="/login" class="text-emerald-600 font-bold hover:underline">Log in of
					registreer</nuxt-link> om te boeken.
			</p>
		</div>
	</div>
</template>