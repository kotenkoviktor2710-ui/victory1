<script setup lang="ts">
defineProps<{
  title: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="game-modal-overlay" @click.self="emit('close')">
    <div class="game-modal" role="dialog" aria-modal="true">
      <header class="game-modal__header">
        <h2 class="game-modal__title">{{ title }}</h2>
        <button type="button" class="game-modal__close" aria-label="Закрыть" @click="emit('close')">
          ✕
        </button>
      </header>
      <div class="game-modal__body">
        <slot />
      </div>
    </div>
  </div>
</template>
