<script lang="ts" setup>
const title = ref('Yoga Ravennah | Priveles');
const description = ref('Ontdek de voordelen van privé yogalessen bij Yoga Ravennah in Rotterdam Nesselande. Persoonlijke aandacht, flexibele locaties en lessen op maat – perfect voor individuele of groepssessies. Neem contact op voor de mogelijkheden!.');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/voordelen');

definePageMeta({
	// layout: 'yoga'
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

</script>

<template>
	<div>
		<Header alignment="object-center" image="/priveles.jpeg">
			<h1 class="text-3xl md:text-6xl uppercase font-black">
        <span class="emerald-underline">Privé Yogalessen</span
        ><span class="text-emerald-600">.</span>
			</h1>
			<p class="intro">
				Wil je liever persoonlijke aandacht of yoga beoefenen in een besloten setting? Ik bied ook privé yogalessen aan,
				volledig afgestemd op jouw wensen en behoeften.
			</p>
		</Header>

		<div class="bg-emerald-100 p-8 md:px-0 md:py-24">
			<div class="container title-dark mx-auto">
				<div
						id="twijfels"
						class="md:flex justify-between items-center md:space-x-12 space-y-8 md:space-y-0"
				>
					<div class="w-full md:w-1/2 space-y-8">
						<h2 class="text-2xl md:text-4xl uppercase font-black text-emerald-900">
              <span class="emerald-underline"
              >Waarom priveles</span
              ><span class="text-emerald-600">?</span>
						</h2>
					</div>
					<div class="text-xl">
						<p class="mb-2">
							Een privéles kan bijvoorbeeld helpen als je:
						</p>
						<span class="text-emerald-600 font-bold">1: Eigen doelen</span>

						<p class="mb-2 text-emerald-900">
							Specifieke doelen hebt, zoals meer ontspanning, flexibiliteit of kracht.
						</p>

						<span class="text-emerald-600 font-bold">2: Geen afleiding</span>

						<p class="mb-2 text-emerald-900">
							Jezelf zekerder wilt voelen voordat je deelneemt aan groepslessen.
						</p>

						<span class="text-emerald-600 font-bold">3: Alleen of samen</span>

						<p class="mb-2 text-emerald-900">
							Samen met vrienden, familie of collega’s een exclusieve les wilt volgen.
						</p>

					</div>
				</div>
			</div>
		</div>

		<div class="p-8 md:px-0 md:py-24">
			<div class="container mx-auto">
				<div
						class="md:flex justify-between items-center md:space-x-12 space-y-8 md:space-y-0"
				>
					<div class="w-full md:w-1/2">
						<NuxtImg
								class="w-full h-64 md:h-96 object-center object-cover rounded-3xl shadow-xl"
								src="/priveles-2.jpeg"
						/>
					</div>
					<div id="onlineDating" class="w-full md:w-1/2 space-y-6">
						<h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline">Locatie en mogelijkheden</span
              ><span class="text-emerald-700">.</span>
						</h2>
						<p class="intro">
							Hatha yoga omvat houdingen en asana's die de mobiliteit van
							gewrichten vergroten en de spieren versterken.
						</p>
						<p class="intro">Privélessen zijn altijd op aanvraag en flexibel in te plannen. We kunnen samen bepalen wat het
							beste past:</p>
						<ul>
							<li class="ml-2"><p class="intro">- In mijn studio in Rotterdam Nesselande.</p></li>
							<li class="ml-2"><p class="intro">- Bij jou thuis of op een andere gewenste locatie.</p></li>
							<li class="ml-2"><p class="intro">- Voor één persoon of een groep.</p></li>
						</ul>
						<h6>Neem contact op</h6>
						<p class="intro">Ben je benieuwd naar de mogelijkheden? Neem gerust contact met me op. Samen bespreken we jouw
							wensen, de locatie en het aantal deelnemers. Ik kijk ernaar uit om je te helpen je yogadoelen te bereiken!</p>
					</div>
				</div>
			</div>
		</div>
		<div class="p-8 md:px-0 md:py-24">
			<div class="container mx-auto">
				<div
						class="md:flex justify-between items-center md:space-x-12 space-y-8 md:space-y-0"
				>
					<div class="w-full md:w-1/5">
						<NuxtImg
								class="w-full h-64 md:h-96 object-center object-cover rounded-3xl shadow-xl"
								src="/priveles-7.jpeg"
						/>
					</div>
					<div class="w-full md:w-1/5">
						<NuxtImg
								class="w-full h-64 md:h-96 object-center object-cover rounded-3xl shadow-xl"
								src="/priveles-4.jpeg"
						/>
					</div>
					<div class="w-full md:w-1/5">
						<NuxtImg
								class="w-full h-64 md:h-96 object-center object-cover rounded-3xl shadow-xl"
								src="/priveles-5.jpeg"
						/>
					</div>
					<div class="w-full md:w-1/5">
						<NuxtImg
								class="w-full h-64 md:h-96 object-center object-cover rounded-3xl shadow-xl"
								src="/priveles-6.jpeg"
						/>
					</div>
					<div class="w-full md:w-1/5">
						<NuxtImg
								class="w-full h-64 md:h-96 object-center object-cover rounded-3xl shadow-xl"
								src="/priveles-8.jpeg"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>