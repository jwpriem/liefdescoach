<template>
  <div>
    <Header image="/les-buiten.jpg" alignment="object-bottom">
      <h1 class="text-3xl md:text-6xl uppercase font-black">
        <span class="emerald-underline">Voordelen</span
        ><span class="text-emerald-600">.</span>
      </h1>
      <p class="intro">
        Hatha yoga biedt talloze voordelen, waaronder stressvermindering, verbeterde flexibiliteit, spierversterking,
        beter evenwicht en coördinatie, evenals innerlijke rust en zelfbewustzijn.
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
              >5 voorbeelden van de vele voordelen van yoga</span
              ><span class="text-emerald-600">.</span>
            </h2>
          </div>
          <div class="text-xl">
            <p class="mb-2">
              Wat doet het nou met een mens?
            </p>
            <span class="text-emerald-600 font-bold">1: Stressvermindering</span>

            <p class="mb-2 text-emerald-900">
              Yoga omvat ademhalingsoefeningen en meditatie, wat kan helpen stress te verminderen en een gevoel van
              kalmte te bevorderen.
            </p>

            <span class="text-emerald-600 font-bold">2: Verbeterde Flexibiliteit</span>

            <p class="mb-2 text-emerald-900">
              Door regelmatige yogabeoefening kun je je flexibiliteit vergroten, waardoor je lichaam soepeler wordt en
              de kans op blessures afneemt.
            </p>

            <span class="text-emerald-600 font-bold">3: Versterking van Spieren</span>

            <p class="mb-2 text-emerald-900">
              Yoga houdingen vereisen vaak het aanspannen van verschillende spiergroepen, wat kan bijdragen aan het
              versterken van spieren en het verbeteren van de algehele lichaamshouding.
            </p>

            <span class="text-emerald-600 font-bold">4: Beter Evenwicht en Coördinatie</span>

            <p class="mb-2 text-emerald-900">
              Veel yogahoudingen richten zich op het verbeteren van balans en coördinatie, wat niet alleen fysieke
              voordelen heeft, maar ook de concentratie kan versterken.
            </p>

            <span class="text-emerald-600 font-bold">5: Innerlijke Rust en Zelfbewustzijn</span>

            <p class="mb-2 text-emerald-900">
              Yoga moedigt mindfulness aan, waardoor je je meer bewust wordt van je lichaam, gedachten en emoties. Dit
              kan leiden tot een groter gevoel van innerlijke rust en zelfbewustzijn.
            </p>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Header from "@/components/Header";

export default {
  layout: 'yoga',
  components: {
    Header,
  },
};
</script>