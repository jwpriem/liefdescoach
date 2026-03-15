<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

defineProps<{
	tabs: TabsItem[]
	modelValue: number
}>()

defineEmits<{
	'update:modelValue': [value: number]
}>()
</script>

<template>
	<nav
		class="fixed bottom-0 left-0 right-0 z-50 bg-gray-950 border-t border-gray-800 flex"
		style="padding-bottom: env(safe-area-inset-bottom)"
	>
		<button
			v-for="(tab, i) in tabs"
			:key="i"
			class="flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors"
			:class="modelValue === i ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'"
			@click="$emit('update:modelValue', i)"
		>
			<UIcon :name="tab.icon as string" class="size-5 shrink-0" />
			<span class="hidden sm:block truncate max-w-full px-1">{{ tab.label }}</span>
		</button>
	</nav>
</template>
