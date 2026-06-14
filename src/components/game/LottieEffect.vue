<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import lottie, { type AnimationItem } from 'lottie-web'

const props = withDefaults(
  defineProps<{
    path: string
    loop?: boolean
  }>(),
  {
    loop: true,
  },
)

const emit = defineEmits<{
  complete: []
}>()

const root = ref<HTMLElement | null>(null)
let animation: AnimationItem | null = null

function destroyAnimation(): void {
  animation?.destroy()
  animation = null
}

function loadAnimation(): void {
  destroyAnimation()
  if (!root.value) return

  animation = lottie.loadAnimation({
    container: root.value,
    renderer: 'svg',
    loop: props.loop,
    autoplay: true,
    path: props.path,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid meet',
    },
  })

  animation.addEventListener('complete', () => {
    emit('complete')
  })
}

onMounted(loadAnimation)
watch(() => props.path, loadAnimation)
onUnmounted(destroyAnimation)
</script>

<template>
  <div ref="root" class="lottie-effect" aria-hidden="true" />
</template>

<style scoped>
.lottie-effect {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  overflow: visible;
}

.lottie-effect :deep(svg) {
  width: 100% !important;
  height: 100% !important;
  display: block;
}
</style>
