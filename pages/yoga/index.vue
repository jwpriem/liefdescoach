<template>
  <div>
    <Header image="/ravennah-yoga.jpg">
      <h1 class="text-3xl md:text-6xl uppercase font-black">
        <span class="emerald-underline">Yoga Ravennah</span
        ><span class="text-emerald-700">.</span>
      </h1>
      <p class="intro">
        Welkom bij Yoga Ravennah - de perfecte plek om kennis te maken met yoga en jezelf te verwelkomen in een laagdrempelige en ongedwongen omgeving. In Rotterdam Nesselande bied ik small group lessen met veel aandacht en ruimte voor persoonlijke groei.
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
              moedigen diepe ademhaling en ontspanning aan, wat kan helpen
              stress te verminderen. Door je aandacht te richten op je
              ademhaling en het beoefenen van mindfulness, kun je kalmeren en
              innerlijke rust vinden.
            </p>
            <Yoga />
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
              src="/flexibiliteit.jpg"
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

<script>
import Header from "@/components/Header";

export default {
  layout: "yoga",
  head() {
    return {
      title: this.pageTitle,
      meta:[
        { hid: 'description', name: 'description', content:  this.description },
        { hid: 'og:title', property: 'og:title', content: this.pageTitle },
        { hid: 'og:url', property: 'og:url', content: this.pageUrl },
        { hid: 'og:description', property: 'og:description', content: this.description },
        { hid: 'og:image', property: 'og:image', content: this.ogImage},

        // twitter card
        { hid: "twitter:title", name: "twitter:title", content: this.pageTitle },
        { hid: "twitter:url", name: "twitter:url", content: this.pageUrl },
        { hid: 'twitter:description', name: 'twitter:description', content: this.description },
        { hid: "twitter:image", name: "twitter:image", content: this.ogImage},
        ]
    }
  },
  data(){
    return {
      pageTitle: 'Yoga Ravennah | Ongedwongen yogales in Rotterdam Nesselande',
      description: 'De perfecte plek om kennis te maken met yoga en jezelf te verwelkomen in een laagdrempelige en ongedwongen omgeving. In Rotterdam Nesselande bied ik small group lessen met veel aandacht en ruimte voor persoonlijke groei.',
      ogImage: 'https://www.ravennah.com/ravennah-social.jpg',
      pageUrl: 'https://www.ravennah.com/yoga'
    }
  },
  components: {
    Header
  }
};
</script>
