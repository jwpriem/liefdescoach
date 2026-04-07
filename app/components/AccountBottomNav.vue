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
	<nav class="fixed bottom-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-t border-gray-800/80 flex"
		style="padding-bottom: max(calc(env(safe-area-inset-bottom) - 6px), 6px)">
		<template v-for="(tab, i) in tabs" :key="i">
			<button v-if="!(tab as any).hidden"
				class="flex-1 flex flex-col items-center gap-1 pt-3 pb-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:rounded-md"
				:class="modelValue === i ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'"
				@click="$emit('update:modelValue', i)">
				<UIcon :name="tab.icon as string" class="size-7 shrink-0" />
				<span class="text-[10px] leading-tight truncate max-w-full px-0.5">{{ tab.label }}</span>
			</button>
		</template>
	</nav>
</template>
