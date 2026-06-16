<script setup lang="ts">
import type { T2RecipesResult } from '~/lib/engine/trace'

const props = defineProps<{ data: T2RecipesResult | null }>()

const rows = computed(() => {
  if (!props.data || props.data.t2Count === 0) return []
  const { cards, t2Count } = props.data
  const list = cards
    .filter((c) => c.name !== 'The Fantasticar') // toujours présent (commander) → non informatif
    .map((c) => ({ name: c.name, pct: c.count / t2Count }))
  return list
})
const maxPct = computed(() => rows.value.reduce((m, r) => Math.max(m, r.pct), 0) || 1)
</script>

<template>
  <div class="card pad t2card">
    <h2 class="ph">Combos T2 — cartes impliquées</h2>

    <template v-if="data && data.t2Count > 0">
      <p class="intro faint">
        Sur <b>{{ data.t2Count.toLocaleString('fr-FR') }}</b> combos T2 (échantillon de
        {{ data.games.toLocaleString('fr-FR') }} parties). Fréquence à laquelle chaque carte apparaît
        dans la ligne gagnante. <b>The Fantasticar</b> y est toujours (commander, hors des 99).
        À T2 il faut quasi toujours une <b>source de 2 mana</b> (Crystal Vein / City of Traitors /
        Jeweled Amulet) + <b>3 sorts à 0</b> au choix — d'où les sorts à 0 tous autour de ~12 %.
      </p>

      <ul class="bars">
        <li v-for="r in rows" :key="r.name">
          <span class="nm" :title="r.name">{{ r.name }}</span>
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
  grid-template-columns: 190px 1fr 40px;
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
