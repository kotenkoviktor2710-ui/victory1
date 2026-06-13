<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { startNovel } from '@/game/startNovel'
import { t } from '@/game/i18n.js'

const root = ref<HTMLElement | null>(null)
const error = ref<string | null>(null)

onMounted(async () => {
  if (!root.value) return

  try {
    await startNovel(root.value)
  } catch (err) {
    console.error('[NovelView]', err)
    error.value = t('loader.loadError')
  }
})
</script>

<template>
  <div class="novel-shell">
    <div v-if="error" class="novel-shell__error" role="alert">{{ error }}</div>
    <div v-else ref="root" id="app" class="novel-shell__root" />
  </div>
</template>

<style scoped>
.novel-shell {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #000;
}

.novel-shell__root {
  width: 100%;
  height: 100%;
}

.novel-shell__error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 24px;
  color: #fff;
  text-align: center;
}
</style>
