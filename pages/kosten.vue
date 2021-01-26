<template>
  <div>
    <Header image="https://images.unsplash.com/photo-1527137342181-19aab11a8ee8?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" alignment="object-bottom">
      <h1 class="text-3xl md:text-6xl uppercase font-black text-gray-800">
        <span class="pink-underline">Kosten</span><span class="text-rose-600">.</span>
      </h1>
      <p class="intro">
        Ik vind het belangrijk dat je comfortabel en vertrouwt bij me voelt. Om dit te ervaring plan ik graag een kennismakingsessie in waar we in 20 minuutjes gratis en vrijblijvend elkaar iets beter leren kennen. Ben je overtuigt? Dan plannen we gelijk de eerste sessie. Een sessie duurt een uur en kost &euro; 75,-. We kunnen digitaal via Zoom of kom bij me zitten in een lekkere stoel. Ga je liever een rondje lopen samen dat kan dit natuurlijk ook.
      </p>
      <nuxt-link to="/intake" class="rose button">
        Plan intake
      </nuxt-link>
    </Header>
  </div>
</template>

<script>
import Header from '@/components/Header'
export default {
  components: {
    Header
  }
}
</script>
