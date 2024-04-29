<script setup lang="ts">
const title = ref('Yoga Ravennah | Ongedwongen yogales in Rotterdam Nesselande');
const description = ref('De perfecte plek om kennis te maken met yoga en jezelf te verwelkomen in een laagdrempelige en ongedwongen omgeving. In Rotterdam Nesselande bied ik small group lessen met veel aandacht en ruimte voor persoonlijke groei.');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/yoga');

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

</script>

<template>
    <div>
        <Header image="/ravennah-yoga.jpg">
            <h1 class="text-3xl md:text-6xl uppercase font-black">
        <span class="emerald-underline">Yoga Ravennah</span
        ><span class="text-emerald-700">.</span>
            </h1>
            <p class="intro">
                Welkom bij Yoga Ravennah - de perfecte plek om kennis te maken met yoga en jezelf te verwelkomen in een
                laagdrempelige en ongedwongen omgeving. In Rotterdam Nesselande bied ik small group lessen met veel
                aandacht en ruimte voor persoonlijke groei.
            </p>
            <div>
                <p class="intro">
                    Wil jij:
                </p>
                <ul class="intro">
                    <li class="flex justify-start items-center space-x-3 cursor-pointer">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-6 h-6 inline-block stroke-current text-emerald-700 animate-pulse"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M9.143 17.082a24.248 24.248 0 0 0 3.844.148m-3.844-.148a23.856 23.856 0 0 1-5.455-1.31 8.964 8.964 0 0 0 2.3-5.542m3.155 6.852a3 3 0 0 0 5.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 0 0 3.536-1.003A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6.53 6.53m10.245 10.245L6.53 6.53M3 3l3.53 3.53"
                            />
                        </svg>

                        <p>Rust</p>
                        <svg
                            class="w-3 h-3 inline-block stroke-current"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                        </svg>
                    </li>
                    <li class="flex justify-start items-center space-x-3 cursor-pointer">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-6 h-6 inline-block stroke-current text-emerald-700 animate-pulse"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z"
                            />
                        </svg>
                        <p>Balans</p>
                        <svg
                            class="w-3 h-3 inline-block stroke-current"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                        </svg>
                    </li>
                    <li class="flex justify-start items-center space-x-3">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-6 h-6 inline-block stroke-current text-emerald-700 animate-pulse"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M4.5 10.5h6.75V15H4.5v-4.5ZM3.75 18h15A2.25 2.25 0 0 0 21 15.75v-6a2.25 2.25 0 0 0-2.25-2.25h-15A2.25 2.25 0 0 0 1.5 9.75v6A2.25 2.25 0 0 0 3.75 18Z"
                            />
                        </svg>
                        <p>Opladen</p>

                        <svg
                            class="w-3 h-3 inline-block stroke-current"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                        </svg>
                    </li>
                </ul>
            </div>
            <div
                class="flex justify-start items-center gap-x-3"
            >
                <nuxt-link to="/yoga/lessen" class="emerald button">
                    Les schema
                </nuxt-link>
                <nuxt-link to="/yoga/tarieven" class="emerald-outlined button">
                    Tarieven
                </nuxt-link>
            </div>
        </Header>
        <div class="bg-emerald-100 title-dark">
            <div id="weesJezelf" class="container mx-auto p-8 md:px-0 md:py-24">
                <div class="flex justify-center items-center">
                    <div class="w-full md:w-1/2 md:text-center space-y-8">
                        <h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline text-emerald-900"
              >Stressvermindering</span
              ><span class="text-emerald-700">.</span>
                        </h2>
                        <p class="text-2xl text-emerald-900">
                            <span class="text-emerald-700 font-bold">Hatha</span> yoga
                            moedigt diepe ademhaling en ontspanning aan, wat kan helpen
                            stress te verminderen. Door je aandacht te richten op je
                            ademhaling en het beoefenen van mindfulness, kun je kalmeren en
                            innerlijke rust vinden.
                        </p>
                        <Yoga/>
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
                        <img
                            class="w-full h-64 md:h-96 object-center object-cover rounded-3xl shadow-xl"
                            src="/ravennah_squat_2.webp"
                        />
                    </div>
                    <div id="onlineDating" class="w-full md:w-1/2 space-y-6">
                        <h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline">Mobiliteit</span
              ><span class="text-emerald-700">.</span>
                        </h2>
                        <p class="intro">
                            Hatha yoga omvat houdingen en asana's die de mobiliteit van
                            gewrichten vergroten en de spieren versterken.
                        </p>
                    </div>
                </div>
            </div>
        </div>
        <Proefles />
        <div class="bg-orange-100">
            <div id="peachy" class="container mx-auto p-8 md:px-0 md:py-24">
                <div class="flex justify-center items-center">
                    <div class="w-full md:w-1/2 md:text-center space-y-8">
	                    <svg xmlns="http://www.w3.org/2000/svg" width="4em" height="4em" viewBox="0 0 64 64" class="inline-block stroke-current text-orange-700"><path fill="currentColor" d="M41.666 11.71c-2.629 0-5.34.509-8.02 1.57c.131-1.304.727-1.404.727-4.187c0-1.226-.966-1.915-1.869-1.958c-1.757-2.401-3.528-2.448-4.217-2.354c-.524-.818-1.86-2.521-3.992-2.726c-9.977-.951-20.249 10.542-20.249 10.542s5.028-1.897 10.257-1.695C9.136 17.348 2 21.032 2 21.032c2.253-.852 4.539-1.883 6.769-3.244c2.234-1.359 4.356-3.008 6.424-4.766c2.071-1.734 4.178-3.614 6.522-5.107a23.11 23.11 0 0 1 3.512-1.857c1.152-.462 2.27-.805 3.316-1.002a25.205 25.205 0 0 0-6.695 3.272c-2.178 1.501-4.191 3.313-6.294 5.093c-2.1 1.771-4.369 3.519-6.721 4.827a32.213 32.213 0 0 1-3.49 1.689c-1.142.446-2.265.828-3.343 1.095c0 0 2.103.217 5.207-.063c-1.743 3.272-2.757 7.243-2.757 11.705c0 15.467 9.003 23.823 19.888 27.055c2.695.801 2.627 2.219 5.445 2.27l.239.001c3.902 0 10.464-1.593 14.007-2.911C54.033 55.366 62 47.223 62 32.673c-.001-12.455-9.467-20.963-20.334-20.963M28.484 5.806c.537-.056 1.742.037 3.058 1.578c-.343.236-.577.636-.577 1.222c0 2.353-1.078 3.371-1.311 4.569a20.93 20.93 0 0 0-3.607-1.167c1.777-2.153 2.295-4.9 2.437-6.202m14.498 50.471C39.521 57.565 33.348 59 30.022 59l-.186-.001c-.683-.013-.747-.059-1.372-.502c-.691-.488-1.639-1.159-3.272-1.645C18.566 54.886 7.45 49.128 7.45 32.673c0-4.734 1.292-9.034 3.64-12.277c3.892-.797 8.429-2.445 12.344-5.772c2.246.205 4.539.925 6.836 2.164l.94.508c1.841 2.164 3.229 4.468 4.356 6.809c1.622 3.506 2.648 7.106 3.081 10.686c.423 3.576.253 7.129-.701 10.508c-.988 3.367-2.833 6.52-5.847 9.205a16.177 16.177 0 0 0 8.916-8.209c1.718-3.533 2.172-7.488 1.707-11.41c-.485-3.927-1.879-7.881-4.269-11.541c-1.476-2.28-3.39-4.515-5.731-6.354l.322-.163c2.784-1.404 5.685-2.116 8.621-2.116c9.881 0 17.333 7.723 17.334 17.963C59 47.256 50.29 53.558 42.982 56.277"/></svg>
                        <h2 class="text-2xl md:text-4xl uppercase font-black">
                            <span class="orange-underline text-orange-900"
                                >Peachy Bum</span
                                ><span class="text-orange-700">.</span>
                        </h2>
                        <p class="text-2xl text-orange-900">
                            Wie graag (ook) iets actievers doet dan yoga en het leuk vind om buiten te sporten geef ik in de zomermaanden bij goed weer van april tot september <span class="text-orange-700 font-bold">Peachy Bum</span> lessen!
                        </p>
                        <div
                            class="flex justify-center items-center gap-x-3"
                            >
                            <nuxt-link to="/yoga/lessen" class="orange button">
                    Les schema
                            </nuxt-link>
                            <nuxt-link to="/yoga/peachy-bum" class="orange-outlined button">
                    Wat is Peachy Bum?
                            </nuxt-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div
                    id="twijfels"
                    class="md:flex justify-between items-center md:space-x-12 space-y-8 md:space-y-0"
                >
                    <div class="w-full md:w-1/2 space-y-8">
                        <h2
                            class="text-2xl md:text-4xl uppercase font-black text-emerald-900"
                        >
              <span class="emerald-underline">Alleen maar voordelen</span
              ><span class="text-emerald-700">.</span>
                        </h2>
                        <p class="intro intro-dark text-emerald-900">
                            Al met al bied Hatha yoga veel voordelen voor zowel je fysieke als
                            mentale gezondheid. Het regelmatig beoefenen van deze yogastijlen
                            kan een waardevolle aanvulling zijn op je levensstijl en bijdragen
                            aan een gezonder en evenwichtiger leven.
                        </p>
                    </div>
                    <div class="w-full md:w-1/2 space-y-6 text-center">
                        <ul class="text-xl text-emerald-700 italic font-light">
                            <li>
                                Kracht & evenwicht
                            </li>
                            <li>
                                Verbeterde ademhaling
                            </li>
                            <li>
                                Verbeterde slaap
                            </li>
                        </ul>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-10 h-10 inline-block"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                        </svg>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>
