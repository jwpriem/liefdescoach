<template>
  <div class="space-y-1">
    <div v-if="label.length" class="flex items-center" :class="required ? 'justify-start' : 'justify-between'">
      <label :for="id" v-text="label" />
      <sup v-if="required" class="required">*</sup>
    </div>
    <div class="input-wrapper">
      <input
        :id="id"
        :class="hasError ? 'hasError' : ''"
        :type="type"
        :value="value"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        @change="$emit('change', $event.target.value)"
        @input="$emit('input', $event.target.value)"
        @focusout="$emit('focusout', $event.target.value)"
        @focusin="$emit('focusin', $event.target.value)"
        @keyup="$emit('keyup', $event.target.value)"
      >
      <div v-if="hasError" class="error">
        <span v-text="label + ' ' + error" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    id: {
      type: String,
      required: true
    },
    label: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'text'
    },
    value: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    error: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    hasError () {
      return this.error.length
    }
  }
}
</script>
