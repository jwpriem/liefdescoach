<template>
  <div>
    <Header image="/ravennah-zwart.jpg" alignment="object-top">
      <h1 class="text-3xl md:text-6xl uppercase font-black">
        <span class="emerald-underline">Ravennah</span
        ><span class="text-emerald-600">.</span>
      </h1>
      <p class="intro">
        Welkom! Ik ben Ravennah Matser, een optimistische, energieke, creatieve
        verbinder die dagelijks streeft naar bijzondere momenten. Mijn focus
        ligt op het verspreiden van positiviteit, het vinden van innerlijke rust
        en het bevorderen van balans tussen lichaam en geest. Als moeder van
        twee, getrouwd en zelf een workaholic, begrijp ik de complexiteit van
        het dagelijks leven.
      </p>
      <p class="intro">
        Mijn ervaring met yoga heeft me geleerd hoe essentieel het is om bewust
        te genieten en onvoorwaardelijke liefde voor jezelf te koesteren. Als
        yoga-instructeur probeer ik taboes te doorbreken en een vertrouwde sfeer
        te creëren waar iedereen zichzelf kan zijn en rust kan vinden. Ontdek
        jezelf en geef het waardevolle geschenk van zelfontdekking. Overweeg
        gerust een van mijn lessen – je bent van harte welkom.
      </p>
    </Header>
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
      pageTitle: 'Yoga Ravennah | Over mij',
      description: 'Ik ben Ravennah Matser, een optimistische, energieke, creatieve verbinder die dagelijks streeft naar bijzondere momenten. Mijn focus ligt op het verspreiden van positiviteit, het vinden van innerlijke rust.',
      ogImage: 'https://www.ravennah.com/ravennah-social.jpg',
      pageUrl: 'https://www.ravennah.com/yoga/over'
    }
  },
  components: {
    Header,
  },
};
</script>
