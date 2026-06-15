<script setup lang="ts">
import type { SimResult, TurnProbabilities } from '~/lib/engine/types'

const props = defineProps<{
  primary: SimResult
  compare?: SimResult | null
}>()

const turns = ['t2', 't3', 't4', 't5'] as const
const labels = { t2: 'T2', t3: 'T3', t4: 'T4', t5: 'T5' }

function avg(r: SimResult): TurnProbabilities {
  return {
    t2: (r.onPlay.t2 + r.onDraw.t2) / 2,
    t3: (r.onPlay.t3 + r.onDraw.t3) / 2,
    t4: (r.onPlay.t4 + r.onDraw.t4) / 2,
    t5: (r.onPlay.t5 + r.onDraw.t5) / 2,
  }
}

const rows = computed(() => [
  { key: 'play', label: 'On the play', cur: props.primary.onPlay, base: props.compare?.onPlay },
  { key: 'draw', label: 'On the draw', cur: props.primary.onDraw, base: props.compare?.onDraw },
  {
    key: 'avg',
    label: 'Moyenne play/draw',
    cur: avg(props.primary),
    base: props.compare ? avg(props.compare) : undefined,
  },
])

function fmt(p: number) {
  return (p * 100).toFixed(1)
}
function deltaPt(cur: number, base: number) {
  return (cur - base) * 100
}
</script>

<template>
  <table class="results">
    <thead>
      <tr>
        <th></th>
        <th v-for="t in turns" :key="t" :class="{ hot: t === 't3' }">{{ labels[t] }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row.key" :class="{ avg: row.key === 'avg' }">
        <td class="rlab">{{ row.label }}</td>
        <td v-for="t in turns" :key="t" :class="{ hot: t === 't3' }">
          <span class="val">{{ fmt(row.cur[t]) }}<span class="pct">%</span></span>
          <span
            v-if="row.base"
            class="delta"
            :class="
              deltaPt(row.cur[t], row.base[t]) >= 0.05
                ? 'delta-up'
                : deltaPt(row.cur[t], row.base[t]) <= -0.05
                  ? 'delta-down'
                  : 'faint'
            "
          >
            {{ deltaPt(row.cur[t], row.base[t]) >= 0 ? '▲ +' : '▼ ' }}{{ deltaPt(row.cur[t], row.base[t]).toFixed(1) }}
          </span>
        </td>
      </tr>
    </tbody>
  </table>
  <p class="ci faint">
    ± {{ primary.ciHalfWidthPt.toFixed(1) }} pt (intervalle de confiance 95 %, {{ primary.iterations.toLocaleString('fr') }} itérations/axe)
  </p>
</template>

<style scoped>
.results {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}
.results th,
.results td {
  padding: 7px 8px;
  text-align: right;
  border-bottom: 1px solid var(--border);
}
.results th:first-child,
.results td.rlab {
  text-align: left;
  color: var(--text-dim);
  font-weight: 500;
}
.results th {
  font-size: 12px;
  color: var(--text-faint);
  font-weight: 600;
}
.results th.hot,
.results td.hot {
  background: rgba(217, 164, 65, 0.08);
}
.results th.hot {
  color: var(--accent);
}
.results tr.avg td {
  border-bottom: none;
  color: var(--text-dim);
}
.val {
  font-weight: 600;
}
.pct {
  font-size: 11px;
  color: var(--text-faint);
  margin-left: 1px;
}
.delta {
  display: block;
  font-size: 11px;
  font-weight: 600;
}
.ci {
  font-size: 11px;
  margin: 6px 0 0;
}
</style>
