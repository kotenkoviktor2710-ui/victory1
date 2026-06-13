<script setup lang="ts">
import { computed, ref } from 'vue'

const SEGMENT_COUNT = 20

const progress = ref(0)

const progressPercent = computed(() => Math.round(progress.value * 100))

const progressSegments = computed(() => {
  const filledCount = Math.round(progress.value * SEGMENT_COUNT)
  return Array.from({ length: SEGMENT_COUNT }, (_, index) => index < filledCount)
})

function setProgress(value: number): void {
  progress.value = Math.min(1, Math.max(0, value))
}

async function finish(): Promise<void> {
  setProgress(1)
  await new Promise((resolve) => window.setTimeout(resolve, 280))
}

function waitUntilReady(): Promise<void> {
  return Promise.resolve()
}

defineExpose({ setProgress, finish, waitUntilReady })
</script>

<template>
  <div
    class="loading-screen"
    role="status"
    aria-live="polite"
    aria-busy="true"
    aria-label="Загрузка"
  >
    <div class="loading-screen__bg" aria-hidden="true" />
    <div class="loading-screen__vignette" aria-hidden="true" />
    <div class="loading-screen__scanlines" aria-hidden="true" />

    <div class="loading-screen__panel">
      <div class="loading-screen__progress">
        <div class="loading-screen__progress-head">
          <span class="loading-screen__progress-label">Загрузка…</span>
          <span class="loading-screen__progress-value">{{ progressPercent }}%</span>
        </div>
        <div
          class="loading-screen__progress-track"
          role="progressbar"
          :aria-valuenow="progressPercent"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`Загрузка ${progressPercent}%`"
        >
          <span
            v-for="(filled, index) in progressSegments"
            :key="index"
            class="loading-screen__segment"
            :class="{ 'is-filled': filled }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading-screen {
  --loader-corner: 13px;
  --loader-corner-w: 2px;
  --loader-corners:
    linear-gradient(var(--accent), var(--accent)) left top / var(--loader-corner) var(--loader-corner-w)
      no-repeat,
    linear-gradient(var(--accent), var(--accent)) left top / var(--loader-corner-w) var(--loader-corner)
      no-repeat,
    linear-gradient(var(--accent), var(--accent)) right top / var(--loader-corner) var(--loader-corner-w)
      no-repeat,
    linear-gradient(var(--accent), var(--accent)) right top / var(--loader-corner-w) var(--loader-corner)
      no-repeat,
    linear-gradient(var(--accent), var(--accent)) left bottom / var(--loader-corner) var(--loader-corner-w)
      no-repeat,
    linear-gradient(var(--accent), var(--accent)) left bottom / var(--loader-corner-w) var(--loader-corner)
      no-repeat,
    linear-gradient(var(--accent), var(--accent)) right bottom / var(--loader-corner) var(--loader-corner-w)
      no-repeat,
    linear-gradient(var(--accent), var(--accent)) right bottom / var(--loader-corner-w) var(--loader-corner)
      no-repeat;

  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--ocean-abyss);
  color: var(--ocean-foam);
}

.loading-screen__bg {
  position: absolute;
  inset: 0;
  background: url('/images/8bg.png') center / cover no-repeat;
  transform: scale(1.03);
  opacity: 0.72;
}

.loading-screen__vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(6, 6, 8, 0.55) 0%, transparent 32%),
    linear-gradient(0deg, rgba(6, 6, 8, 0.82) 0%, transparent 48%),
    radial-gradient(ellipse at center, transparent 35%, rgba(6, 6, 8, 0.78) 100%);
}

.loading-screen__scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.04;
  background: repeating-linear-gradient(
    180deg,
    rgba(232, 93, 42, 0.35) 0,
    rgba(232, 93, 42, 0.35) 1px,
    transparent 1px,
    transparent 3px
  );
  mix-blend-mode: soft-light;
}

.loading-screen__panel {
  position: relative;
  z-index: 1;
  isolation: isolate;
  width: min(100%, 560px);
  margin: 0 1.25rem;
  padding: clamp(1.5rem, 4vw, 2rem) clamp(1.25rem, 3vw, 1.75rem) clamp(1.35rem, 3.5vw, 1.85rem);
  border: 1px solid var(--glass-border-soft);
  border-top: 2px solid var(--accent);
  border-radius: var(--glass-radius-lg);
  background: var(--glass-bg-strong);
  backdrop-filter: var(--glass-blur-strong);
  -webkit-backdrop-filter: var(--glass-blur-strong);
  box-shadow:
    var(--glass-shadow),
    inset 0 1px 0 var(--glass-highlight),
    0 0 28px var(--accent-muted);
}

.loading-screen__panel::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--loader-corners);
  pointer-events: none;
  opacity: 0.72;
}

.loading-screen__progress {
  position: relative;
  z-index: 1;
}

.loading-screen__progress-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.55rem;
}

.loading-screen__progress-label,
.loading-screen__progress-value {
  font-family: var(--font-hud);
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ocean-fog);
}

.loading-screen__progress-value {
  color: var(--accent-light);
  text-shadow: 0 0 12px var(--accent-glow);
}

.loading-screen__progress-track {
  display: flex;
  align-items: stretch;
  gap: clamp(3px, 0.75vw, 6px);
  height: clamp(11px, 2.4vw, 15px);
}

.loading-screen__segment {
  flex: 1 1 0;
  min-width: 0;
  border: 1px solid rgba(232, 93, 42, 0.34);
  border-radius: 0;
  background: rgba(8, 8, 12, 0.72);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.42);
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.loading-screen__segment.is-filled {
  border-color: var(--accent-border);
  background: linear-gradient(
    180deg,
    var(--accent-light) 0%,
    var(--accent) 52%,
    var(--accent-dark) 100%
  );
  box-shadow:
    0 0 10px var(--accent-glow),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
}

@media (prefers-reduced-motion: reduce) {
  .loading-screen__segment {
    transition: none;
  }
}
</style>
