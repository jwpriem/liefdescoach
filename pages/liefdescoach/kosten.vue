<template>
  <div>
    <Header image="https://images.unsplash.com/photo-1527137342181-19aab11a8ee8?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" alignment="object-bottom">
      <h1 class="text-3xl md:text-6xl uppercase font-black text-gray-800">
        <span class="pink-underline">Kosten</span><span class="text-rose-600">.</span>
      </h1>
      <p class="intro">
        Ik vind het belangrijk dat je comfortabel en vertrouwt bij me voelt. Om dit te ervaren plan ik graag vrijblijvend en kosteloos een kennismakingsgesprek in waar we in 20 minuutjes elkaar iets beter leren kennen. Ben je overtuigt? Dan plannen we gelijk de eerste sessie. Een sessie duurt circa een uur en kost &euro; 85,- inclusief BTW. We kunnen bellen, met of zonder beeld (via Zoom) of ga je liever een rondje samen lopen. Wat jij prettig vind.
      </p>
      <nuxt-link to="/liefdescoach/intake" class="rose button">
        Plan gesprek
      </nuxt-link>
    </Header>
  </div>
</template>

<script>
import Header from '@/components/Header'
export default {
  layout: 'liefdescoach',
  components: {
    Header
  }
}
</script>
