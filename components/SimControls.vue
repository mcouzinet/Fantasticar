<script setup lang="ts">
import type { MulliganMode } from '~/lib/engine/types'

const props = defineProps<{
  running: boolean
  progress: number
}>()
const emit = defineEmits<{ run: [] }>()

const sim = useSim()

const mulligan = computed({
  get: () => sim.lastConfig.value.mulligan,
  set: (v: MulliganMode) => (sim.lastConfig.value = { ...sim.lastConfig.value, mulligan: v }),
})
const iterations = computed({
  get: () => sim.lastConfig.value.iterations,
  set: (v: number) => (sim.lastConfig.value = { ...sim.lastConfig.value, iterations: Number(v) }),
})

const mulliganOptions: { value: MulliganMode; label: string }[] = [
  { value: 'none', label: 'Aucun' },
  { value: 'london', label: 'London (→5)' },
  { value: 'moxfield', label: 'Moxfield (free 7)' },
]
const precisionOptions = [
  { value: 5000, label: 'Rapide (~5 000)' },
  { value: 15000, label: 'Normal (~15 000)' },
  { value: 40000, label: 'Précis (~40 000)' },
]

// Messages thématiques pendant le calcul (clin d'œil au combo).
const messages = [
  'Mise à feu des réacteurs…',
  'On enchaîne les sorts non-créature…',
  'Décollage visé au T3…',
  'Sacrifice du véhicule…',
  'Quatre jetons 4/4 en approche…',
]
const msgIdx = ref(0)
let msgTimer: ReturnType<typeof setInterval> | null = null
watch(
  () => props.running,
  (r) => {
    if (msgTimer) {
      clearInterval(msgTimer)
      msgTimer = null
    }
    if (r) {
      msgIdx.value = 0
      msgTimer = setInterval(() => (msgIdx.value = (msgIdx.value + 1) % messages.length), 750)
    }
  },
)
onBeforeUnmount(() => {
  if (msgTimer) clearInterval(msgTimer)
})
</script>

<template>
  <div class="controls">
    <div class="field">
      <label for="mulligan-select">Mulligan</label>
      <select id="mulligan-select" v-model="mulligan" :disabled="props.running">
        <option v-for="o in mulliganOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
    </div>
    <div class="field">
      <label for="precision-select">Précision</label>
      <select id="precision-select" v-model="iterations" :disabled="props.running">
        <option v-for="o in precisionOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
    </div>
    <button class="primary run" :disabled="props.running" @click="emit('run')">
      {{ props.running ? 'Calcul…' : '▶ Lancer la simulation' }}
    </button>
  </div>
  <div v-if="props.running || props.progress > 0" class="progress-wrap">
    <div class="sim-line">
      <span class="sim-msg">{{ props.running ? `🚀 ${messages[msgIdx]}` : '✓ Décollage !' }}</span>
      <span class="pct">{{ Math.round(props.progress * 100) }} %</span>
    </div>
    <div class="progress">
      <div class="bar" :style="{ width: `${Math.round(props.progress * 100)}%` }" />
    </div>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.field label {
  font-size: 11px;
  color: var(--text-faint);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.run {
  margin-left: auto;
}
.progress-wrap {
  margin-top: 14px;
}
.sim-line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 5px;
  font-size: 12px;
}
.sim-msg {
  color: var(--accent);
  font-weight: 600;
}
.pct {
  color: var(--text-dim);
  font-variant-numeric: tabular-nums;
}
.progress {
  height: 8px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 999px;
  overflow: hidden;
}
.progress .bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-2), var(--accent));
  transition: width 0.15s ease;
}
</style>
