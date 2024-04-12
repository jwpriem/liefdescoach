<script setup lang="ts">
const props = defineProps({
    image: {
        type: String,
        default: 'https://images.unsplash.com/photo-1527236438218-d82077ae1f85?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=934&q=80',
    },
    alignment: {
        type: String,
        default: 'object-center',
    },
});
</script>

<template>
    <div class="md:h-screen p-8 pt-12 md:p-16 md:flex justify-between items-center md:space-x-16">
        <div class="w-full md:w-1/2 space-y-6">
          <slot/>
        </div>
        <img :src="image" class="h-96 mt-12 md:mt-0 md:h-full rounded-3xl w-full md:w-1/2 shadow-xl object-cover"
             :class="alignment">
    </div>
</template>
