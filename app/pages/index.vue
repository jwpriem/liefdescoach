<script lang="ts" setup>
const title = ref('Yoga Ravennah | Ongedwongen yogales in Rotterdam Nesselande');
const description = ref('Hatha yogalessen in kleine groepen in Rotterdam Nesselande. Persoonlijke aandacht, laagdrempelig en voor iedereen — ook zonder ervaring. Elke zondag om 08:45.');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/');

definePageMeta({
	// layout: 'yoga'
})

useHead({
	title,
	link: [
		{ rel: 'canonical', href: pageUrl },
	],
	meta: [
		{ hid: 'description', name: 'description', content: description },
		{ hid: 'og:title', property: 'og:title', content: title },
		{ hid: 'og:url', property: 'og:url', content: pageUrl },
		{ hid: 'og:description', property: 'og:description', content: description },
		{ hid: 'og:image', property: 'og:image', content: ogImage },
		{ hid: "twitter:title", name: "twitter:title", content: title },
		{ hid: "twitter:url", name: "twitter:url", content: pageUrl },
		{ hid: 'twitter:description', name: 'twitter:description', content: description },
		{ hid: "twitter:image", name: "twitter:image", content: ogImage },
	]
})

useLocalBusinessSchema()
</script>

<template>
	<div>

		<!-- HERO -->
		<Header image="/ravennah-donker.jpg" alt="Yoga docent Ravennah in kleermakerszit">
			<div class="mb-2">
				<span class="bg-emerald-700/80 text-emerald-100 text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide">
					Rotterdam Nesselande
				</span>
			</div>
			<h1 class="text-3xl md:text-6xl uppercase font-black">
				<span class="emerald-underline">Yoga Ravennah</span><span class="text-emerald-700">.</span>
			</h1>
			<p class="intro">
				Minder stress, een soepeler lichaam en een hoofd dat even leeg is. In kleine groepen, met echte
				persoonlijke aandacht — voor beginners en gevorderden.
			</p>
			<div>
				<p class="intro text-emerald-300 text-base mb-2">Wil jij:</p>
				<ul class="intro space-y-1 mb-4">
					<li class="flex justify-start items-center space-x-3">
						<svg class="w-5 h-5 shrink-0 stroke-current text-emerald-600 animate-pulse" fill="none"
							stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round"
								d="M9.143 17.082a24.248 24.248 0 0 0 3.844.148m-3.844-.148a23.856 23.856 0 0 1-5.455-1.31 8.964 8.964 0 0 0 2.3-5.542m3.155 6.852a3 3 0 0 0 5.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 0 0 3.536-1.003A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6.53 6.53m10.245 10.245L6.53 6.53M3 3l3.53 3.53" />
						</svg>
						<span class="text-emerald-100">Rust vinden in een druk leven</span>
					</li>
					<li class="flex justify-start items-center space-x-3">
						<svg class="w-5 h-5 shrink-0 stroke-current text-emerald-600 animate-pulse" fill="none"
							stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round"
								d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
						</svg>
						<span class="text-emerald-100">Sterker en soepeler worden</span>
					</li>
					<li class="flex justify-start items-center space-x-3">
						<svg class="w-5 h-5 shrink-0 stroke-current text-emerald-600 animate-pulse" fill="none"
							stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round"
								d="M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M4.5 10.5h6.75V15H4.5v-4.5ZM3.75 18h15A2.25 2.25 0 0 0 21 15.75v-6a2.25 2.25 0 0 0-2.25-2.25h-15A2.25 2.25 0 0 0 1.5 9.75v6A2.25 2.25 0 0 0 3.75 18Z" />
						</svg>
						<span class="text-emerald-100">Jezelf opladen voor de week</span>
					</li>
				</ul>
			</div>
			<div class="flex flex-wrap gap-3">
				<nuxt-link class="emerald button" to="/lessen">Bekijk het rooster</nuxt-link>
				<nuxt-link class="emerald-outlined button" to="/tarieven">Tarieven</nuxt-link>
				<nuxt-link class="emerald-outlined button" to="/eerste-les">Nog nooit yoga gedaan?</nuxt-link>
			</div>
		</Header>

		<!-- FEATURE STRIP -->
		<div class="p-8 md:px-0 md:py-12">
			<div class="container mx-auto">
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div v-for="feat in [
						{ icon: 'M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z', label: 'Kleine groepen', sub: 'Maximaal 8 personen per les' },
						{ icon: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', label: 'Geen ervaring nodig', sub: 'Toegankelijk voor beginners' },
						{ icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5', label: 'Elke zondag', sub: '08:45 – 09:45, gratis parkeren' },
					]" :key="feat.label"
						class="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center space-x-4">
						<div class="w-10 h-10 rounded-xl bg-emerald-900/50 flex items-center justify-center shrink-0">
							<svg class="w-5 h-5 text-emerald-400 stroke-current" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" :d="feat.icon" />
							</svg>
						</div>
						<div>
							<p class="text-emerald-100 font-bold text-sm">{{ feat.label }}</p>
							<p class="text-emerald-400/70 text-xs">{{ feat.sub }}</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- OVER RAVENNAH -->
		<div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
			<div class="container mx-auto">
				<div class="md:flex justify-between items-center md:space-x-16 space-y-8 md:space-y-0">
					<div class="w-full md:w-1/2">
						<img class="w-full h-72 md:h-[30rem] object-cover object-top rounded-3xl shadow-xl"
							src="/ravennah-zwart.jpg" alt="Yoga docent Ravennah" />
					</div>
					<div class="w-full md:w-1/2 space-y-6">
						<h2 class="text-2xl md:text-4xl uppercase font-black text-emerald-900">
							<span class="emerald-underline">Ik ben Ravennah</span><span class="text-emerald-600">.</span>
						</h2>
						<p class="text-lg text-emerald-900 font-light leading-relaxed">
							Als moeder van twee en zelf een workaholic begrijp ik hoe druk het leven kan zijn. Yoga
							leerde me iets wat geen agenda-app ooit kon: hoe je écht pauzeert.
						</p>
						<p class="text-lg text-emerald-900 font-light leading-relaxed">
							Ik geef lessen in kleine groepen, met ruimte voor wie je bent — geen
							prestatiedruk, geen oordeel. Alleen jij, je ademhaling en de mat.
						</p>
						<nuxt-link class="emerald-outlined button inline-block" to="/over">
							Lees meer over mij
						</nuxt-link>
					</div>
				</div>
			</div>
		</div>

		<!-- VOORDELEN -->
		<div class="p-8 md:px-0 md:py-24">
			<div class="container mx-auto">
				<div class="text-center mb-12 space-y-4">
					<h2 class="text-2xl md:text-4xl uppercase font-black">
						<span class="emerald-underline">Wat yoga je brengt</span><span class="text-emerald-600">.</span>
					</h2>
					<p class="intro max-w-xl mx-auto">
						Hatha yoga werkt op lichaam én geest. Dit zijn de voordelen die je het snelst merkt.
					</p>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
					<div v-for="benefit in [
						{ icon: 'M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z', title: 'Minder stress', text: 'Bewuste ademhaling brengt je zenuwstelsel tot rust.' },
						{ icon: 'M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z', title: 'Meer flexibiliteit', text: 'Soepelere spieren en gewrichten, minder blessurerisico.' },
						{ icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z', title: 'Meer kracht', text: 'Diepe spiergroepen die je anders overslaat worden geactiveerd.' },
						{ icon: 'M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z', title: 'Betere slaap', text: 'Yoga kalmeert en bereidt je lichaam voor op diepe rust.' },
					]" :key="benefit.title"
						class="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3 hover:-translate-y-1 transition-transform duration-300">
						<div class="w-10 h-10 rounded-xl bg-emerald-900/50 flex items-center justify-center">
							<svg class="w-5 h-5 text-emerald-400 stroke-current" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" :d="benefit.icon" />
							</svg>
						</div>
						<h3 class="text-sm font-bold uppercase text-emerald-100">{{ benefit.title }}</h3>
						<p class="text-emerald-200/70 text-sm font-light leading-relaxed">{{ benefit.text }}</p>
					</div>
				</div>
				<div class="text-center">
					<nuxt-link class="emerald-outlined button inline-block" to="/voordelen">
						Alle voordelen van yoga
					</nuxt-link>
				</div>
			</div>
		</div>

		<!-- WAT GEBEURT ER IN EEN LES -->
		<div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
			<div class="container mx-auto">
				<div class="md:flex justify-between items-center md:space-x-16 space-y-8 md:space-y-0">
					<div class="w-full md:w-1/2 space-y-6">
						<h2 class="text-2xl md:text-4xl uppercase font-black text-emerald-900">
							<span class="emerald-underline">Een les van binnen</span><span class="text-emerald-600">.</span>
						</h2>
						<p class="text-lg text-emerald-900 font-light leading-relaxed">
							Elke les heeft een vaste, rustgevende opbouw. Je hoeft niets te weten of te kunnen —
							gewoon komen is genoeg.
						</p>
						<ol class="space-y-4">
							<li v-for="(step, i) in [
								{ title: 'Landen', text: 'Even stilstaan. De buitenwereld loslaten en jezelf welkom heten op de mat.' },
								{ title: 'Warming-up', text: 'Zachte bewegingen om gewrichten los te draaien en de adem te verdiepen.' },
								{ title: 'Asana\'s', text: 'Houdingen die kracht, flexibiliteit en balans combineren — op jouw tempo.' },
								{ title: 'Savasana', text: 'Diepe ontspanning. Lichaam en geest integreren alles wat er is gedaan.' },
							]" :key="step.title" class="flex items-start space-x-4">
								<div class="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
									<span class="text-white text-sm font-bold">{{ i + 1 }}</span>
								</div>
								<div>
									<p class="font-bold text-emerald-900 uppercase text-sm">{{ step.title }}</p>
									<p class="text-emerald-800 text-base font-light leading-relaxed">{{ step.text }}</p>
								</div>
							</li>
						</ol>
						<nuxt-link class="emerald-outlined button inline-block" to="/hatha-yoga">
							Wat is hatha yoga?
						</nuxt-link>
					</div>
					<div class="w-full md:w-1/2">
						<img class="w-full h-72 md:h-[30rem] object-cover object-center rounded-3xl shadow-xl"
							src="/warmingup.webp" alt="Warming up tijdens yogales" />
					</div>
				</div>
			</div>
		</div>

		<!-- PRAKTISCHE INFO + CTA -->
		<div class="p-8 md:px-0 md:py-24">
			<div class="container mx-auto">
				<div class="md:flex justify-between items-center md:space-x-16 space-y-8 md:space-y-0">
					<div class="w-full md:w-1/2 space-y-6">
						<h2 class="text-2xl md:text-4xl uppercase font-black">
							<span class="emerald-underline">Kom langs</span><span class="text-emerald-600">.</span>
						</h2>
						<p class="intro">
							Elke zondag om 08:45 geef ik les aan de Emmy van Leersumhof 24a in Rotterdam Nesselande.
							Begin je week met rust, energie en ruimte voor jezelf.
						</p>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div v-for="info in [
								{ icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5', label: 'Dag & tijd', value: 'Zondag 08:45 – 09:45' },
								{ icon: 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z', label: 'Adres', value: 'Emmy van Leersumhof 24a, Rotterdam' },
								{ icon: 'M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12', label: 'Parkeren', value: 'Gratis voor de deur' },
								{ icon: 'M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z', label: 'Groepsgrootte', value: 'Maximaal 8 personen' },
							]" :key="info.label"
								class="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center space-x-3">
								<div class="w-8 h-8 rounded-lg bg-emerald-900/50 flex items-center justify-center shrink-0">
									<svg class="w-4 h-4 text-emerald-400 stroke-current" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" :d="info.icon" />
									</svg>
								</div>
								<div>
									<p class="text-xs uppercase text-emerald-400 font-bold tracking-wide">{{ info.label }}</p>
									<p class="text-emerald-100 text-sm font-medium">{{ info.value }}</p>
								</div>
							</div>
						</div>
						<div class="flex flex-wrap gap-3 pt-2">
							<nuxt-link class="emerald button" to="/lessen">Bekijk het rooster</nuxt-link>
							<nuxt-link class="emerald-outlined button" to="/contact">Neem contact op</nuxt-link>
						</div>
					</div>
					<div class="w-full md:w-1/2">
						<img class="w-full h-72 md:h-[30rem] object-cover object-center rounded-3xl shadow-xl"
							src="/les-buiten.jpg" alt="Yoga les buiten" />
					</div>
				</div>
			</div>
		</div>

		<!-- VERKEN VERDER -->
		<div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
			<div class="container mx-auto">
				<div class="text-center mb-10 space-y-3">
					<h2 class="text-2xl md:text-4xl uppercase font-black text-emerald-900">
						<span class="emerald-underline">Meer ontdekken</span><span class="text-emerald-600">.</span>
					</h2>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
					<nuxt-link to="/hatha-yoga" class="group bg-white/60 rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-300">
						<img class="w-full h-44 object-cover object-center" src="/yoga-sfeer.jpg" alt="Hatha yoga" />
						<div class="p-5 space-y-2">
							<h3 class="text-base font-bold uppercase text-emerald-900">Wat is Hatha Yoga?</h3>
							<p class="text-emerald-800 text-sm font-light leading-relaxed">
								De yogastijl die rust en activiteit in balans brengt. Alles over Ha, Tha en wat je kunt verwachten.
							</p>
							<span class="text-emerald-600 text-sm font-bold">Lees meer →</span>
						</div>
					</nuxt-link>
					<nuxt-link to="/priveles" class="group bg-white/60 rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-300">
						<img class="w-full h-44 object-cover object-center" src="/priveles-2.jpeg" alt="Privé yogales" />
						<div class="p-5 space-y-2">
							<h3 class="text-base font-bold uppercase text-emerald-900">Privé Yogalessen</h3>
							<p class="text-emerald-800 text-sm font-light leading-relaxed">
								Volledig op jouw tempo en doelen. Individueel of samen met vrienden of collega's.
							</p>
							<span class="text-emerald-600 text-sm font-bold">Lees meer →</span>
						</div>
					</nuxt-link>
					<nuxt-link to="/voordelen" class="group bg-white/60 rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-300">
						<img class="w-full h-44 object-cover object-center" src="/flexibiliteit.jpg" alt="Voordelen van yoga" />
						<div class="p-5 space-y-2">
							<h3 class="text-base font-bold uppercase text-emerald-900">Voordelen van Yoga</h3>
							<p class="text-emerald-800 text-sm font-light leading-relaxed">
								Van stressvermindering tot betere slaap. Wat yoga concreet voor je doet, fysiek en mentaal.
							</p>
							<span class="text-emerald-600 text-sm font-bold">Lees meer →</span>
						</div>
					</nuxt-link>
				</div>
			</div>
		</div>

	</div>
</template>
