<script setup lang="ts">
const props = defineProps<{
  running: boolean
  progress: number
}>()
const emit = defineEmits<{ run: [] }>()

const sim = useSim()
const iterations = computed(() => sim.lastConfig.value.iterations)

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
    <button class="primary run" :disabled="props.running" @click="emit('run')">
      {{ props.running ? 'Calcul…' : '▶ Lancer la simulation' }}
    </button>
    <dl class="config">
      <div><dt>Mulligan</dt><dd>London (→5)</dd></div>
      <div><dt>Précision</dt><dd>{{ iterations.toLocaleString('fr-FR') }} itérations</dd></div>
    </dl>
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
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}
.run {
  font-size: 15px;
  font-weight: 700;
  padding: 12px 24px;
}
.config {
  display: flex;
  gap: 24px;
  margin: 0;
}
.config div {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.config dt {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-faint);
}
.config dd {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dim);
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
