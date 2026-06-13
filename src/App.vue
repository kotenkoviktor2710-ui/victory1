<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { RouterView } from 'vue-router'

import LoadingScreen from '@/components/LoadingScreen.vue'
import { runAppBoot } from '@/composables/useAppBoot'

const bootDone = ref(false)
const loadingRef = ref<InstanceType<typeof LoadingScreen> | null>(null)

onMounted(async () => {
  await nextTick()
  await loadingRef.value?.waitUntilReady()

  await runAppBoot((progress) => {
    loadingRef.value?.setProgress(progress)
  })

  await loadingRef.value?.finish()
  bootDone.value = true
})
</script>

<template>
  <Transition name="loader-fade">
    <LoadingScreen v-if="!bootDone" ref="loadingRef" />
  </Transition>
  <RouterView v-if="bootDone" />
</template>

<style>
.loader-fade-leave-active {
  transition: opacity 0.32s ease;
}

.loader-fade-leave-to {
  opacity: 0;
}
</style>
