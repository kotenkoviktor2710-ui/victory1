<script setup lang="ts">
import PlaygroundScreen from '@/components/game/PlaygroundScreen.vue'
import { useGamePersistence } from '@/composables/useGamePersistence'

useGamePersistence()
</script>

<template>
  <PlaygroundScreen />
</template>
