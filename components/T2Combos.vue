<script setup lang="ts">
import type { T2RecipesResult } from '~/lib/engine/trace'

const props = defineProps<{ data: T2RecipesResult | null }>()

const rows = computed(() => {
  if (!props.data || props.data.t2Count === 0) return []
  const { combos, t2Count } = props.data
  return combos.map((c) => ({ label: c.label, pct: c.count / t2Count }))
})
const maxPct = computed(() => rows.value.reduce((m, r) => Math.max(m, r.pct), 0) || 1)
const coverage = computed(() => {
  if (!props.data || props.data.t2Count === 0) return 0
  const shown = props.data.combos.reduce((s, c) => s + c.count, 0)
  return shown / props.data.t2Count
})
</script>

<template>
  <div class="card pad t2card">
    <h2 class="ph">Combos T2 — recettes de mana</h2>

    <template v-if="data && data.t2Count > 0">
      <p class="intro faint">
        Sur <b>{{ data.t2Count.toLocaleString('fr-FR') }}</b> combos T2, les
        <b>combinaisons de sources de mana</b> qui les débloquent. Les terrains et les
        <b>sorts à 0</b> (« cheerios ») sont comptés, pas détaillés (ils sont toujours là). Le
        Fantasticar et les 3 sorts non-créature se lancent le même tour.
      </p>

      <ul class="bars">
        <li v-for="r in rows" :key="r.label">
          <span class="nm" :title="r.label">{{ r.label }}</span>
          <span class="track"><span class="fill" :style="{ width: `${(r.pct / maxPct) * 100}%` }" /></span>
          <span class="pct">{{ (r.pct * 100).toFixed(1) }}%</span>
        </li>
      </ul>

      <p class="foot faint">
        {{ data.distinct.toLocaleString('fr-FR') }} recettes distinctes ; top {{ rows.length }}
        affichées (≈ {{ (coverage * 100).toFixed(0) }} % des combos T2).
      </p>
    </template>

    <p v-else class="intro faint">Aucun combo T2 dans l'échantillon (combo trop rare pour ce deck).</p>
  </div>
</template>

<style scoped>
.intro {
  font-size: 12px;
  line-height: 1.55;
  margin: 0 0 14px;
}
.bars {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 380px;
  overflow-y: auto;
  padding-right: 6px;
}
.bars li {
  display: grid;
  grid-template-columns: 1fr 110px 48px;
  align-items: center;
  gap: 10px;
}
.nm {
  font-size: 12px;
  color: var(--text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.track {
  height: 9px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 999px;
  overflow: hidden;
}
.fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--accent-2), var(--accent));
  border-radius: 999px;
}
.pct {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.foot {
  font-size: 11px;
  margin: 12px 0 0;
}
@media (max-width: 560px) {
  .bars li {
    grid-template-columns: 1fr 70px 42px;
    gap: 6px;
  }
}
</style>
