<script setup lang="ts">
const title = ref('Yoga Ravennah | Bo Bol');
const description = ref('Graag wil ik een gastdocent aan jullie voorstellen. De meesten van jullie zullen hem al kennen uit de lessen, want het is niemand minder dan Bo Bol.');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/bo-bol');

definePageMeta({
})

useHead({
    title,
    meta: [
        {content: description},
        {content: title},
        {content: pageUrl},
        {content: description},
        {content: ogImage},

        // twitter card
        {content: title},
        {content: pageUrl},
        {content: description},
        {content: ogImage},
        ]
})

</script>

<template>
  <div>
    <Header image="/bo-bol.webp" alignment="object-top">
      <h1 class="text-3xl md:text-6xl uppercase font-black">
        <span class="emerald-underline">Bo Bol</span
        ><span class="text-emerald-600">.</span>
      </h1>
      <p class="intro">
        Graag wil ik een gastdocent aan jullie voorstellen. De meesten van jullie zullen hem al kennen uit de lessen, want het is niemand minder dan Bo Bol.
        Wat velen misschien nog niet wisten, is dat Bo ook jarenlange ervaring heeft in het lesgeven van yoga. En aangezien bij mij 1 + 1 vaak 3 is, ontstond het idee voor deze bijzondere gastles.
      </p>

      <div>
        <h3 class="font-bold text-xl uppercase mb-4">Wie is Bo?</h3>

        <p>
          Bo’s lesmotto:<br>
          “Geen yin zonder yang.”
        </p>
      </div>

      <div>
        <p>
          Zijn lessen volgen vaak een vaste, rustige opbouw:
        </p>
        <ul class="list-disc ml-5 mt-2 space-y-1">
          <li>Welkom & ontspanningsritueel</li>
          <li>3 à 4 yin-asana’s</li>
          <li>Aangevuld met yang-oefeningen</li>
          <li>Doorlopend aandacht voor de ademhaling, met name tijdens het yin-gedeelte</li>
          <li>Afsluiting met ZEN-zitten (3–5 minuten), een ontspanningsmeditatie of een ademhalingsoefening</li>
        </ul>
      </div>

      <p>
        Met yoga wil Bo de deelnemers iets meegeven voor hun welzijn, iets wat je niet alleen op de mat, maar ook daarbuiten kunt voelen.
      </p>

      <p>
        Bo geeft inmiddels zo’n 15 jaar les, waarvan de laatste 10 jaar met een sterke focus op yin yoga. Hij volgde zijn opleiding bij Ram Jain.
        Zijn allereerste yogales was al begin jaren ’70, waarna yoga lange tijd onderdeel bleef als onderhoud, totdat hij later weer in lesverband instapte — en uiteindelijk zelf docent werd.
      </p>

      <div>
        <h3 class="font-bold text-xl uppercase mb-4">Achtergrond</h3>

        <p>
          Maatschappelijk gezien heeft Bo een rijke en brede achtergrond:
        </p>
        <ul class="list-disc ml-5 mt-2 space-y-1">
          <li>Begonnen met fysiotherapie</li>
          <li>Overgestapt naar verpleegkunde, met o.a. 3 jaar IC-ervaring</li>
          <li>Groepswerk & diverse functies in de zorg</li>
          <li>De laatste 7 jaar werkzaam als maatschappelijk werker, met accent op schuldhulpverlening en begeleiding achter de voordeur</li>
        </ul>
      </div>

      <p>
        Deze levenservaring voel je terug in zijn lessen: gegrond, menselijk en met aandacht.
      </p>
    </Header>
  </div>
</template>
