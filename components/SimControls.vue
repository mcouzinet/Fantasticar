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
  <div v-if="props.running || props.progress > 0" class="progress">
    <div class="bar" :style="{ width: `${Math.round(props.progress * 100)}%` }" />
    <span class="pct">{{ Math.round(props.progress * 100) }} %</span>
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
.progress {
  position: relative;
  height: 8px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 999px;
  margin-top: 12px;
  overflow: hidden;
}
.progress .bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-2), var(--accent));
  transition: width 0.15s ease;
}
.progress .pct {
  position: absolute;
  right: 8px;
  top: -18px;
  font-size: 11px;
  color: var(--text-dim);
}
</style>
