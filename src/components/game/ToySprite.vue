<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { DEFAULT_TOY_IMAGE, getToyImageByLevel } from '@/domain/data/toyImages'
import { getToyName } from '@/domain/data/toys'

const props = withDefaults(
  defineProps<{
    definitionId?: string
    level?: number
    image?: string
    alt?: string
    size?: string
  }>(),
  {
    level: 1,
    size: 'clamp(56px, 14vw, 80px)',
  },
)

const imageError = ref(false)

watch(
  () => [props.image, props.level] as const,
  () => {
    imageError.value = false
  },
)

const src = computed(() => {
  if (imageError.value) return DEFAULT_TOY_IMAGE
  if (props.image) return props.image
  return getToyImageByLevel(props.level)
})

const label = computed(() => {
  if (props.alt) return props.alt
  if (props.definitionId) return getToyName(props.definitionId)
  return 'Toy'
})

function onImageError(): void {
  imageError.value = true
}
</script>

<template>
  <span class="toy-sprite" :style="{ '--toy-size': size }">
    <img
      :src="src"
      :alt="label"
      class="toy-sprite__img"
      draggable="false"
      @error="onImageError"
    />
  </span>
</template>

<style scoped>
.toy-sprite {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  pointer-events: none;
}

.toy-sprite__img {
  width: var(--toy-size);
  height: var(--toy-size);
  object-fit: contain;
  user-select: none;
}
</style>
