<script setup lang="ts">
import type { T2RecipesResult } from '~/lib/engine/trace'
import { KIND_META } from '~/lib/ui/kinds'

const props = defineProps<{ data: T2RecipesResult | null }>()

const rows = computed(() => {
  if (!props.data || props.data.t2Count === 0) return []
  const { groups, t2Count } = props.data
  return groups
    .map((g) => ({ label: KIND_META[g.kind].full, pct: g.count / t2Count }))
    .filter((r) => r.pct >= 0.005) // masque les catégories quasi absentes (< 0,5 %)
})
const maxPct = computed(() => rows.value.reduce((m, r) => Math.max(m, r.pct), 0) || 1)
</script>

<template>
  <div class="card pad t2card">
    <h2 class="ph">Combos T2 — cartes impliquées</h2>

    <template v-if="data && data.t2Count > 0">
      <p class="intro faint">
        Sur <b>{{ data.t2Count.toLocaleString('fr-FR') }}</b> combos T2 (échantillon de
        {{ data.games.toLocaleString('fr-FR') }} parties). Pour chaque <b>catégorie</b>, part des
        combos T2 qui en utilisent au moins une carte. À T2 il faut quasi toujours une
        <b>source de 2 mana</b> (City of Traitors / Crystal Vein) + des <b>sorts à 0</b> ;
        Jeweled Amulet aide une partie du temps.
      </p>

      <ul class="bars">
        <li v-for="r in rows" :key="r.label">
          <span class="nm" :title="r.label">{{ r.label }}</span>
          <span class="track"><span class="fill" :style="{ width: `${(r.pct / maxPct) * 100}%` }" /></span>
          <span class="pct">{{ (r.pct * 100).toFixed(0) }}%</span>
        </li>
      </ul>
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
  gap: 3px;
  max-height: 360px;
  overflow-y: auto;
  padding-right: 6px;
}
.bars li {
  display: grid;
  grid-template-columns: 280px 1fr 40px;
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
  height: 10px;
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
@media (max-width: 560px) {
  .bars li {
    grid-template-columns: 130px 1fr 34px;
    gap: 6px;
  }
  .nm {
    font-size: 11px;
  }
}
</style>
