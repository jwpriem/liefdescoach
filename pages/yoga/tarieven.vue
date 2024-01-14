<template>
  <div>
    <Header image="/ravennah-pose.jpg" alignment="object-center">
      <h1 class="text-3xl md:text-6xl uppercase font-black">
        <span class="emerald-underline">Tarieven</span><span class="text-emerald-600">.</span>
      </h1>
      <p class="intro">Je kunt een losse les meedoen voor <span
        class="text-emerald-700 font-bold">&euro; 15,- per les</span> of je kunt een strippenkaart kopen van <span
        class="text-emerald-700 font-bold">10 lessen voor &euro; 125,-</span> (&euro; 12,50 per les).</p>
      
      <p class="intro">
        Boeken kan via <a href="https://www.instagram.com/yogaravennah" target="_blank"><u>Instagram</u></a> of <nuxt-link to="/yoga/contact"><u>contactformulier</u></nuxt-link>. Vul bij het bericht in welke datum je wilt boeken.
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
  components: {
    Header
  }
}
</script>
