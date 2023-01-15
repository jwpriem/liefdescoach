<template>
  <div>
    <Header image="https://images.unsplash.com/photo-1545239351-1141bd82e8a6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=781&q=80" alignment="object-bottom">
      <h1 class="text-3xl md:text-6xl uppercase font-black text-gray-800">
        <span class="pink-underline">Digitale coach</span><span class="text-rose-600">.</span>
      </h1>
      <p class="intro">
        Soms is het lastig om met iemand te praten over de liefde en is het ontvangen van advies van een onbekende makkelijker dan van een bekende. Gelukkig heb ik een digitale coach die je op je eerste drie vragen alvast wat antwoorden kan geven. Ben je nieuwsgierig naar wat ik kan? Dan kun je er aan het einde voor kiezen om je vragen te delen met je contactgegevens zodat ik je kan benaderen voor een gratis intakegesprek.
      </p>
      <div class="md:flex justify-start items-center md:space-x-3 space-y-2 md:space-y-0">
        <a href="#digitaleCoach" class="rose button">
          Chat met digitale coach
        </a>
        <nuxt-link to="/intake" class="gray button">
          Intake plannen?
        </nuxt-link>
      </div>
    </Header>
    <div class="bg-gray-100">
      <div id="digitaleCoach" class="container mx-auto p-8 md:px-0 md:py-24">
        <div class="flex justify-center items-center">
          <div class="w-full md:w-1/2 md:text-center space-y-8">
            <h2 class="text-2xl md:text-4xl uppercase font-black text-gray-800">
              <span class="pink-underline">Chat met digitale coach</span><span class="text-rose-600">.</span>
            </h2>
            <p class="text-2xl">
              Je kunt drie vragen stellen aan mijn digitale coach. Bijvoorbeeld '<i>Mijn partner lijkt zich de laatste tijd niet op zn gemak te voelen. Hoe komt dit?</i>' of '<i>Ik houd niet van online daten, wat zijn de alternatieven?</i>' <span class="text-rose-600 font-bold">Probeer het nu!</span>
            </p>
            <div class="grid grid-cols-12" v-for="(item, index) in conversation" :key="index">
              <div class="col-start-1 md:col-start-6 col-end-12 p-2 rounded-lg" v-if="index % 2 === 0">
                <div class="flex items-center justify-start flex-row-reverse">
                  <div class="flex items-center justify-center h-10 w-10 rounded-full bg-white flex-shrink-0">
                    <svg class="w-6 h-6 inline-block stroke-current text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="{2}" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  </div>
                  <div class="relative mr-3 text-sm bg-rose-100 text-rose-800 py-2 px-4 shadow-lg rounded-xl text-left">
                    <div>{{item}}</div>
                  </div>
                </div>
              </div>
              <div class="col-start-1 md:col-end-8 col-end-12 p-2 rounded-lg" v-else>
                <div class="flex flex-row items-center">
                  <div class="flex items-center justify-center h-10 w-10 rounded-full bg-rose-600 text-white flex-shrink-0">
                    Jij
                  </div>
                  <div class="text-left relative ml-3 text-sm bg-white py-2 px-4 shadow-lg rounded-xl">
                    <div>{{item}}</div>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="waitingForAnswer" class="text-right">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="animate-ping w-2 h-2 inline-block stroke-current text-rose-600"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
            </div>

            <div class="mt-8 space-y-3 lightForm" v-if="conversation.length < 7">
              <div class="w-full text-center text-xs">
                Om een goed antwoord te geven is een duidelijke vraag nodig. Gebruik minimaal 100 tekens om je vraag en situatie aan te geven.
              </div>
              <LCTextarea
                id="naam"
                v-model="question"
                label="Vraag"
                :required="false"
                type="text"
                placeholder="Vraag van minimaal 100 tekens"
                class="w-full"
              />
              <div class="w-full text-right text-xs">
                {{ countChars() }} / <span class="text-rose-600">100</span>
              </div>
              <div @click="chat()" class="rose button block">
                Stel vraag
              </div>
            </div>
            <div class="mt-8 space-y-3 lightForm" v-else>
              <p class='intro'>
                Een echte coach voelt veel beter aan wat eventueel het onderliggende probleem is. Wil je graag eens kennismaken en weten hoe het is om met een liefdescoach te praten? Vul het formulier in en ik neem contact met je op!
              </p>
              <nuxt-link to="/intake" class="rose button">
                Plan een gratis intake!
              </nuxt-link>
            </div>
            <svg class="w-8 h-8 inline-block stroke-current text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="{2}" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Header from '@/components/Header'
import LCTextarea from '~/components/forms/LCTextarea'

const { Configuration, OpenAIApi } = require('openai')
const configuration = new Configuration({
  apiKey: process.env.openAi
})

const openai = new OpenAIApi(configuration)

export default {
  components: {
    Header,
    LCTextarea
  },

  data () {
    return {
      prompt: 'The following is a conversation with an dating coach. The coach is loving, helpful, careful and very friendly.\n\nHuman:Hi, maybe you can help me.\nAI:Absolutely! Please explain to me what is happening in your life?\nHuman:I find it hard to date online. All the men seem to look different at love then i do.\nAI:And how do you see love then?\nHuman:I want somebody who is caring and loving and a warm person. When i got home to share the day. Where do i find such love?That is a great question! Have you tried being more open and honest about what you are looking for in a relationship when going on dates? It can be difficult to find someone who is compatible with your definition of love, but if you are willing to put yourself out there and take risks, you will likely come across someone who meets your expectations. Additionally, you can look for people who share similar interests and values as you do - this might increase your chances of finding someone who shares your vision of love.',
      question: '',
      answer: '',
      conversation: ['Wat speelt er in je leven? Waar kan ik je mee helpen?'],
      waitingForAnswer: false
    }
  },

  methods: {
    async chat () {
      // Add question to conversation and prompt for history
      this.conversation.push(this.question)
      this.question = 'Human:' + this.question
      this.prompt = this.prompt += this.question
      this.question = ''
      this.waitingForAnswer = true

      const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: this.prompt,
        temperature: 0.9,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0.0,
        presence_penalty: 0.6,
        stop: [' Human:', ' AI:']
      })
      // Add answer to conversation and prompt for history
      this.waitingForAnswer = false
      this.answer = response.data.choices[0].text
      this.conversation.push(this.answer.replace('AI:', ''))
      this.prompt = this.prompt += this.answer
      this.answer = ''
    },
    countChars () {
      return this.question.length
    }
  }
}
</script>
