<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    wide?: boolean
    picker?: boolean
  }>(),
  {
    wide: false,
    picker: false,
  },
)

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="game-modal-overlay" @click.self="emit('close')">
    <div
      class="game-modal"
      :class="{ 'game-modal--wide': wide, 'game-modal--picker': picker }"
      role="dialog"
      aria-modal="true"
    >
      <header class="game-modal__header">
        <h2 class="game-modal__title game-text-stroke">{{ title }}</h2>
        <div class="game-modal__header-actions">
          <slot name="subtitle" />
          <button
            type="button"
            class="game-sketch-btn game-sketch-btn--red game-sketch-btn--sm game-modal__close"
            aria-label="Закрыть"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>
      </header>
      <div class="game-modal__body">
        <slot />
      </div>
    </div>
  </div>
</template>
