<script setup lang="ts">
import type { TurnProbabilities } from '~/lib/engine/types'

const props = defineProps<{
  onPlay: TurnProbabilities
  onDraw: TurnProbabilities
}>()

const turns = ['t2', 't3', 't4', 't5'] as const
const labels = { t2: 'T2', t3: 'T3', t4: 'T4', t5: 'T5' }

// Géométrie SVG
const W = 460
const H = 200
const PAD_B = 26
const PAD_T = 10
const PAD_L = 28
const groupW = (W - PAD_L) / turns.length
const barW = 26
const plotH = H - PAD_B - PAD_T

function y(p: number) {
  return PAD_T + plotH * (1 - p)
}
function h(p: number) {
  return plotH * p
}
</script>

<template>
  <svg :viewBox="`0 0 ${W} ${H}`" class="bars" role="img" aria-label="Probabilités de combo par tour">
    <!-- grille horizontale 0/25/50/75/100 -->
    <g class="grid">
      <template v-for="g in [0, 0.25, 0.5, 0.75, 1]" :key="g">
        <line :x1="PAD_L" :x2="W" :y1="y(g)" :y2="y(g)" />
        <text :x="PAD_L - 5" :y="y(g) + 3" text-anchor="end">{{ Math.round(g * 100) }}</text>
      </template>
    </g>
    <g v-for="(t, i) in turns" :key="t">
      <!-- on the play -->
      <rect
        :x="PAD_L + i * groupW + groupW / 2 - barW - 2"
        :y="y(props.onPlay[t])"
        :width="barW"
        :height="h(props.onPlay[t])"
        :class="['bar', 'play', { hot: t === 't3' }]"
      />
      <!-- on the draw -->
      <rect
        :x="PAD_L + i * groupW + groupW / 2 + 2"
        :y="y(props.onDraw[t])"
        :width="barW"
        :height="h(props.onDraw[t])"
        :class="['bar', 'draw', { hot: t === 't3' }]"
      />
      <text :x="PAD_L + i * groupW + groupW / 2" :y="H - 9" text-anchor="middle" class="xlab">
        {{ labels[t] }}
      </text>
    </g>
  </svg>
  <div class="legend">
    <span><i class="sw play" /> On the play</span>
    <span><i class="sw draw" /> On the draw</span>
    <span class="faint">T3 = cible du deck</span>
  </div>
</template>

<style scoped>
.bars {
  width: 100%;
  height: auto;
  display: block;
}
.grid line {
  stroke: var(--border);
  stroke-width: 1;
}
.grid text {
  fill: var(--text-faint);
  font-size: 9px;
}
.xlab {
  fill: var(--text-dim);
  font-size: 11px;
  font-weight: 600;
}
.bar.play {
  fill: #2f6fb0;
}
.bar.draw {
  fill: #4493f8;
}
.bar.play.hot {
  fill: #b07e2a;
}
.bar.draw.hot {
  fill: var(--accent);
}
.legend {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-dim);
  margin-top: 6px;
  align-items: center;
}
.legend .sw {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-right: 4px;
  vertical-align: -1px;
}
.legend .sw.play {
  background: #2f6fb0;
}
.legend .sw.draw {
  background: #4493f8;
}
</style>
