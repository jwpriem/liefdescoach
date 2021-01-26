<template>
  <div
    class="messages"
    :class="rootClasses"
  >
    <transition-group name="message">
      <div
        v-for="t in items"
        :key="t.key"
        :class="t.class"
        class="message md:mx-auto"
      >
        <div v-once class="message__text flex flex-no-wrap justify-between items-center space-x-3">
          <div class="w-1/12">
            <svg
              v-if="type === 'info'"
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            ><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <svg
              v-if="type === 'success'"
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            ><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <svg
              v-if="type === 'error'"
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            ><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <svg
              v-if="type === 'warning'"
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            ><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div
            class="message__message w-10/12"
            v-text="t.message"
          />
          <div
            class="message__clear w-1/12 text-right"
          >
            <svg
              class="w-6 h-6 inline-block cursor-pointer"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              @click="remove(t)"
            ><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>
<script>

export default {
  name: 'Message',
  data () {
    return {
      items: [],
      duration: 6000,
      position: 'bottom',
      type: 'info',
      types: {
        success: 'success',
        info: 'info',
        warning: 'warning',
        error: 'error'
      }
    }
  },
  computed: {
    rootClasses () {
      return {
        ['messages--' + this.position]: this.position
      }
    }
  },
  methods: {
    success (message, stay, duration, position = 'bottom') {
      this.add(message, { type: 'success', timeout: duration, stay, position })
    },
    info (message, stay, duration, position = 'bottom') {
      this.add(message, { type: 'info', timeout: duration, stay, position })
    },
    warning (message, stay, duration, position = 'bottom') {
      this.add(message, { type: 'warning', timeout: duration, stay, position })
    },
    error (message, stay, duration, position = 'bottom') {
      this.add(message, { type: 'error', timeout: duration, stay, position })
    },
    add (message, { type, timeout, stay, position }) {
      this.position = position
      this.type = type

      if (!this.$parent) {
        this.$mount()
        if (typeof document !== 'undefined') { document.body.append(this.$el) }
      }
      const item = { message, class: this.itemClasses(type), key: `${Date.now()}-${Math.random()}` }
      this.items.unshift(item)
      if (!stay) {
        setTimeout(() => this.remove(item), timeout || this.duration)
      }
    },
    remove (item) {
      const i = this.items.indexOf(item)
      if (i >= 0) {
        this.items.splice(i, 1)
      }
    },
    itemClasses (type) {
      return { ['message--' + type]: type }
    }
  }
}
</script>

<style lang="postcss">
.messages {
  @apply fixed inset-x-0 w-full z-40 pointer-events-none px-4;

  &.messages--top {
    @apply top-16;
  }

  &.messages--bottom {
    @apply bottom-16;
  }
}

.message {
  @apply p-4 pr-5 rounded-lg mb-1 shadow-lg w-9/12 h-full font-medium pointer-events-auto;

  &.message__message {
    @apply stroke-current;

  }

  &.message__text {

  }

  &-enter,
  &-leave-to {
    opacity: 0;
    -webkit-transform: translateY(100%);
    transform: translateY(100%);
    transition: 0.4s ease;
  }

  &-enter-to {
    opacity: 1;
    transition: 0.4s ease;
  }

  &-leave-to {
    height: 0;
    border: 0;
    margin: 0 auto;
    box-shadow: none;
    overflow: hidden;
    transition: 0.4s ease;
  }

  &.message--info {
    @apply bg-gray-600 text-white;
  }

  &.message--error {
    @apply bg-red-400 text-red-900;
  }

  &.message--success {
    @apply bg-green-400 text-green-900;
  }

  &.message--warning {
    @apply bg-yellow-400 text-yellow-900;
  }
}

</style>
