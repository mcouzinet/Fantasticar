<script setup lang="ts">
import type { RecastResult } from '~/lib/engine/recast'

const props = defineProps<{ data: RecastResult | null }>()

const pct = (x: number) => `${(x * 100).toFixed(1)}%`
const rows = computed(() => {
  if (!props.data || !props.data.conditioned) return []
  const max = props.data.recastByTurn.reduce((m, r) => Math.max(m, r.cum), 0) || 1
  return props.data.recastByTurn.map((r) => ({ turn: r.turn, cum: r.cum, w: (r.cum / max) * 100 }))
})
</script>

<template>
  <div class="card pad">
    <h2 class="ph">Repartir après un combo — recast de la Fantasticar</h2>

    <template v-if="data && data.conditioned > 0">
      <p class="intro faint">
        On garde les parties qui <b>combotent au plus tard à T3</b>
        (<b>{{ pct(data.condRate) }}</b> des parties, 1ᵉʳ combo ≈ T{{ data.firstAvgTurn.toFixed(1) }}),
        puis on continue à jouer. La Fantasticar revient en zone de commandement et coûte
        <b>+2</b> (taxe). On mesure quand on peut la <b>relancer + 3 sorts non-créature</b>.
      </p>

      <div class="big-stat">
        <span class="bn">{{ pct(data.recastEver) }}</span>
        <span class="bl">repartent au moins une fois (≤ T{{ data.maxTurn }})<template v-if="data.recastAvgTurn">,
          recast ≈ <b>T{{ data.recastAvgTurn.toFixed(1) }}</b></template></span>
      </div>

      <ul class="bars">
        <li v-for="r in rows" :key="r.turn">
          <span class="nm">recast ≤ T{{ r.turn }}</span>
          <span class="track"><span class="fill" :style="{ width: `${r.w}%` }" /></span>
          <span class="pct">{{ pct(r.cum) }}</span>
        </li>
      </ul>

      <p class="foot faint">
        Cumulatif parmi les parties combotant ≤ T3. Modèle v1 : un seul recast mesuré, partie
        prolongée jusqu'à T{{ data.maxTurn }}, taxe commandant +2 par lancement.
      </p>
    </template>

    <p v-else class="intro faint">Pas assez de combos ≤ T3 dans l'échantillon pour estimer le recast.</p>
  </div>
</template>

<style scoped>
.intro {
  font-size: 12px;
  line-height: 1.55;
  margin: 0 0 14px;
}
.big-stat {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin: 0 0 16px;
  padding: 12px 14px;
  background: linear-gradient(180deg, rgba(70, 196, 99, 0.08), transparent);
  border: 1px solid var(--border);
  border-radius: 12px;
}
.bn {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--good);
}
.bl {
  font-size: 12.5px;
  color: var(--text-dim);
}
.bars {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.bars li {
  display: grid;
  grid-template-columns: 90px 1fr 52px;
  align-items: center;
  gap: 10px;
}
.nm {
  font-size: 12px;
  color: var(--text-dim);
  font-variant-numeric: tabular-nums;
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
  background: linear-gradient(90deg, var(--accent-2), var(--good));
  border-radius: 999px;
  transition: width 0.4s ease;
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
</style>
