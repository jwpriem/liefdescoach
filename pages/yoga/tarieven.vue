<script lang="ts" setup>
const title = ref('Yoga Ravennah | Tarieven');
const description = ref('Je kunt een losse les meedoen voor € 15,- of je kunt een strippenkaart kopen van € 125,-');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/yoga/tarieven');

const store = useMainStore()

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

const loggedInUser = computed(() => store.loggedInUser);

</script>

<template>
	<div>
		<Header alignment="object-center" image="/ravennah-pose.jpg">
			<h1 class="text-3xl md:text-6xl uppercase font-black">
				<span class="emerald-underline">Tarieven</span><span class="text-emerald-600">.</span>
			</h1>

			<p class="intro">Bij Yoga Ravennah bieden we flexibele opties, zodat je yogalessen kunt volgen op jouw manier. Kies
				voor een strippenkaart of een losse les:</p>

			<h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline">Wat past bij jou</span
              ><span class="text-emerald-700">?</span>
			</h2>
			<h6 class="font-xl font-bold">Kleine strippenkaart (5 lessen): €75</h6>
			<ul>
				<li>
					<svg
							class="w-6 h-6 inline-block stroke-current text-emerald-700"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
					>
						<path
								d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z"
								stroke-linecap="round"
								stroke-linejoin="round"
						/>
					</svg>
					6 maanden geldig.
				</li>
				<li>
					<svg
							class="w-6 h-6 inline-block stroke-current text-emerald-700"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
					>
						<path
								d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z"
								stroke-linecap="round"
								stroke-linejoin="round"
						/>
					</svg>
					€15 per les – perfect voor als je af en toe een les wilt volgen.
				</li>
			</ul>
			<h6 class="font-bold">Grote strippenkaart (10 lessen): €135</h6>
			<ul>
				<li>
					<svg
							class="w-6 h-6 inline-block stroke-current text-emerald-700"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
					>
						<path
								d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z"
								stroke-linecap="round"
								stroke-linejoin="round"
						/>
					</svg>
					12 maanden geldig.
				</li>
				<li>
					<svg
							class="w-6 h-6 inline-block stroke-current text-emerald-700"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
					>
						<path
								d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z"
								stroke-linecap="round"
								stroke-linejoin="round"
						/>
					</svg>
					€13,50 per les – ideaal voor regelmatige yogabeoefening en voordeliger per les.
				</li>
			</ul>
			<h6>Losse les</h6>
			<ul>
				<li>
					<svg
							class="w-6 h-6 inline-block stroke-current text-emerald-700"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
					>
						<path
								d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z"
								stroke-linecap="round"
								stroke-linejoin="round"
						/>
					</svg>
					€16 per les (alleen contante betaling).
				</li>
				<li>
					<svg
							class="w-6 h-6 inline-block stroke-current text-emerald-700"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
					>
						<path
								d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z"
								stroke-linecap="round"
								stroke-linejoin="round"
						/>
					</svg>
					Handig voor eenmalige of incidentele deelname.
				</li>
			</ul>

			<h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline">Boeken van lessen</span
              ><span class="text-emerald-700">.</span>
			</h2>
			<p class="intro">Je kunt je lessen eenvoudig online plannen. Maak een account aan, log in en reserveer jouw plek in
				de les. Een les annuleren kan tot 24 uur voor de les kosteloos.</p>

			<p v-if="!loggedInUser" class="intro">
				Boeken kan door
				<nuxt-link to="/yoga/login"><u>in te loggen</u></nuxt-link>
				. Heb je nog geen account dan kun je een account aanmaken.
			</p>

			<nuxt-link class="emerald button" to="/yoga/lessen">
				Les schema
			</nuxt-link>
		</Header>
	</div>
</template>