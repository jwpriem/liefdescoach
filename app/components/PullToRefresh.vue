<script setup lang="ts">
const pullDistance = ref(0)
const pulling = ref(false)
const refreshing = ref(false)
const startY = ref(0)

const threshold = 80
const maxPull = 120

function onTouchStart(e: TouchEvent) {
	if (window.scrollY === 0 && !refreshing.value) {
		startY.value = e.touches[0].clientY
		pulling.value = true
	}
}

function onTouchMove(e: TouchEvent) {
	if (!pulling.value) return

	const delta = e.touches[0].clientY - startY.value
	if (delta > 0) {
		pullDistance.value = Math.min(delta * 0.5, maxPull)
		if (pullDistance.value > 10) {
			e.preventDefault()
		}
	} else {
		pulling.value = false
		pullDistance.value = 0
	}
}

function onTouchEnd() {
	if (!pulling.value) return

	if (pullDistance.value >= threshold) {
		refreshing.value = true
		pullDistance.value = threshold * 0.5
		window.location.reload()
	} else {
		pullDistance.value = 0
	}
	pulling.value = false
}

onMounted(() => {
	document.addEventListener('touchstart', onTouchStart, { passive: true })
	document.addEventListener('touchmove', onTouchMove, { passive: false })
	document.addEventListener('touchend', onTouchEnd, { passive: true })
})

onUnmounted(() => {
	document.removeEventListener('touchstart', onTouchStart)
	document.removeEventListener('touchmove', onTouchMove)
	document.removeEventListener('touchend', onTouchEnd)
})

const indicatorOpacity = computed(() => Math.min(pullDistance.value / threshold, 1))
const indicatorRotation = computed(() => (pullDistance.value / threshold) * 360)
</script>

<template>
	<div
		v-if="pullDistance > 10"
		class="fixed left-1/2 -translate-x-1/2 z-[100] flex items-center justify-center"
		:style="{ top: `${pullDistance - 20}px` }"
	>
		<div
			class="w-9 h-9 rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center shadow-lg"
			:style="{ opacity: indicatorOpacity }"
		>
			<svg
				v-if="!refreshing"
				class="w-5 h-5 text-emerald-400"
				:style="{ transform: `rotate(${indicatorRotation}deg)` }"
				fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
			</svg>
			<svg
				v-else
				class="w-5 h-5 text-emerald-400 animate-spin"
				fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
			</svg>
		</div>
	</div>
</template>
