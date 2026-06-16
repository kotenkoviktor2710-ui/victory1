<script setup lang="ts">
import GameModal from '@/components/game/GameModal.vue'
import { useI18n } from '@/i18n'

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
</script>

<template>
  <GameModal :title="t('ad.unavailable')" @close="emit('close')">
    <div class="ad-unavailable__body" aria-hidden="true" />
  </GameModal>
</template>

<style scoped>
.ad-unavailable__body {
  min-height: 8px;
}
</style>
