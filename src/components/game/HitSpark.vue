<script setup lang="ts">
import { onMounted } from 'vue'

const props = withDefaults(
  defineProps<{
    rotation?: number
  }>(),
  {
    rotation: 0,
  },
)

const emit = defineEmits<{
  complete: []
}>()

const DURATION_MS = 480

interface SparkRay {
  points: string
  opacity: number
}

function buildLayer(
  count: number,
  angleOffset: number,
  lengthBase: number,
  lengthStep: number,
  widthBase: number,
): SparkRay[] {
  const rays: SparkRay[] = []

  for (let i = 0; i < count; i += 1) {
    const angle = angleOffset + (i / count) * Math.PI * 2
    const length = lengthBase + (i % 4) * lengthStep + ((i * 3) % 5) * 2
    const halfWidth = widthBase + (i % 3) * 0.55
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const px = -sin
    const py = cos

    rays.push({
      points: [
        `${px * halfWidth},${py * halfWidth}`,
        `${cos * length},${sin * length}`,
        `${-px * halfWidth},${-py * halfWidth}`,
      ].join(' '),
      opacity: 0.66 + (i % 3) * 0.05,
    })
  }

  return rays
}

const primaryRays = buildLayer(14, -Math.PI / 2, 26, 5, 1.2)
const secondaryRays = buildLayer(10, -Math.PI / 2 + Math.PI / 10, 16, 3.5, 0.85)

onMounted(() => {
  window.setTimeout(() => emit('complete'), DURATION_MS)
})
</script>

<template>
  <svg
    class="hit-spark"
    viewBox="-50 -50 100 100"
    aria-hidden="true"
    :style="{ '--spark-rotate': `${props.rotation}deg` }"
  >
    <polygon
      v-for="(ray, index) in secondaryRays"
      :key="`s-${index}`"
      :points="ray.points"
      fill="#ffffff"
      :opacity="ray.opacity * 0.68"
    />
    <polygon
      v-for="(ray, index) in primaryRays"
      :key="`p-${index}`"
      :points="ray.points"
      fill="#ffffff"
      :opacity="ray.opacity"
    />
  </svg>
</template>

<style scoped>
.hit-spark {
  width: 100%;
  height: 100%;
  overflow: visible;
  transform-origin: center center;
  animation: hit-spark-pop 0.48s ease-out forwards;
  filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.55));
}

@keyframes hit-spark-pop {
  0% {
    opacity: 0.65;
    transform: scale(0.2) rotate(calc(var(--spark-rotate, 0deg) - 6deg));
  }
  28% {
    opacity: 0.78;
    transform: scale(1) rotate(var(--spark-rotate, 0deg));
  }
  100% {
    opacity: 0;
    transform: scale(1.12) rotate(calc(var(--spark-rotate, 0deg) + 4deg));
  }
}
</style>
