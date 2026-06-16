<script setup lang="ts">
import type { SimResult } from '~/lib/engine/types'

const props = defineProps<{
  primary: SimResult
  compare?: SimResult | null
}>()

const R = 52
const L = Math.PI * R // longueur de l'arc (demi-cercle)
function dash(p: number) {
  return `${(Math.max(0, Math.min(1, p)) * L).toFixed(1)} ${(L + 2).toFixed(1)}`
}
function pct(p: number) {
  return (p * 100).toFixed(1)
}
function deltaPt(cur: number, base: number) {
  return (cur - base) * 100
}

const avg = (r: SimResult) => (r.onPlay.t3 + r.onDraw.t3) / 2

const gauges = computed(() => [
  {
    key: 'play',
    label: 'On the play',
    value: props.primary.onPlay.t3,
    base: props.compare?.onPlay.t3,
    color: 'var(--accent-2)',
  },
  {
    key: 'avg',
    label: 'Moyenne play/draw',
    value: avg(props.primary),
    base: props.compare ? avg(props.compare) : undefined,
    color: 'var(--good)',
  },
  {
    key: 'draw',
    label: 'On the draw',
    value: props.primary.onDraw.t3,
    base: props.compare?.onDraw.t3,
    color: 'var(--accent)',
  },
])
</script>

<template>
  <div class="hero">
    <div class="hero-head">
      <span class="tag">CIBLE</span>
      <h3>P(combo ⩽ T3)</h3>
      <span class="ci faint">±{{ primary.ciHalfWidthPt.toFixed(1) }} pt</span>
    </div>
    <div class="gauges">
      <div v-for="g in gauges" :key="g.key" class="gauge">
        <svg viewBox="0 0 128 78" class="dial">
          <path class="track" d="M12 64 A 52 52 0 0 1 116 64" />
          <path
            class="fill"
            d="M12 64 A 52 52 0 0 1 116 64"
            :stroke="g.color"
            :stroke-dasharray="dash(g.value)"
          />
          <text x="64" y="58" class="big" :fill="g.color">{{ pct(g.value) }}</text>
          <text x="64" y="73" class="unit">%</text>
        </svg>
        <div class="glabel">{{ g.label }}</div>
        <div
          v-if="g.base !== undefined"
          class="gdelta"
          :class="
            deltaPt(g.value, g.base) >= 0.05 ? 'delta-up' : deltaPt(g.value, g.base) <= -0.05 ? 'delta-down' : 'faint'
          "
        >
          {{ deltaPt(g.value, g.base) >= 0 ? '▲ +' : '▼ ' }}{{ deltaPt(g.value, g.base).toFixed(1) }} pt
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.hero-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.hero-head h3 {
  font-size: 14px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.tag {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #1a1205;
  background: var(--accent);
  border-radius: 4px;
  padding: 2px 6px;
}
.ci {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 11px;
}
.gauges {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  max-width: 760px;
}
@media (max-width: 560px) {
  .gauges {
    grid-template-columns: 1fr;
  }
}
.gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px 8px 12px;
}
.dial {
  width: 100%;
  max-width: 200px;
  height: auto;
  overflow: visible;
}
.track {
  fill: none;
  stroke: var(--bg-3);
  stroke-width: 11;
  stroke-linecap: round;
}
.fill {
  fill: none;
  stroke-width: 11;
  stroke-linecap: round;
  transition: stroke-dasharray 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.big {
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 700;
  text-anchor: middle;
}
.unit {
  font-family: var(--font-mono);
  font-size: 11px;
  fill: var(--text-faint);
  text-anchor: middle;
}
.glabel {
  font-size: 12px;
  color: var(--text-dim);
  margin-top: 2px;
}
.gdelta {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  margin-top: 3px;
}
</style>
