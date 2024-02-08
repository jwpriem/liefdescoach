<template>
  <div>
    <Header image="/ravennah-pose.jpg" alignment="object-center">
      <h1 class="text-3xl md:text-6xl uppercase font-black">
        <span class="emerald-underline">Tarieven</span><span class="text-emerald-600">.</span>
      </h1>
      <p class="intro">Je kunt een losse les meedoen voor <span
        class="text-emerald-700 font-bold">&euro; 15,- per les</span> of je kunt een strippenkaart kopen van <span
        class="text-emerald-700 font-bold">10 lessen voor &euro; 125,-</span> (&euro; 12,50 per les). Een strippenkaart is 12 maanden geldig.</p>

        <p class="intro">Een les annuleren kan tot 24 uur voor de les kosteloos.</p>
      
      <p class="intro">
        <span v-if="!loggedInUser">Boeken kan door
        <nuxt-link to="/yoga/login"><u>in te loggen</u></nuxt-link>. Heb je nog geen account dan kun je een account aanmaken.</span>
        Bekijk ook de <nuxt-link to="/yoga/tarieven"><u>tarieven</u></nuxt-link>
      </p>
      
      <nuxt-link to="/yoga/lessen" class="emerald button">
          Les schema
        </nuxt-link>
    </Header>
  </div>
</template>

<script>
import Header from '@/components/Header'

export default {
  layout: 'yoga',
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
      pageTitle: 'Yoga Ravennah | Tarieven',
      description: 'Je kunt een losse les meedoen voor € 15,- of je kunt een strippenkaart kopen van € 125,-',
      ogImage: 'https://www.ravennah.com/ravennah-social.jpg',
      pageUrl: 'https://www.ravennah.com/yoga/tarieven'
    }
  },
  components: {
    Header
  }
}
</script>
