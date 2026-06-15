<script setup lang="ts">
import { GROUPS } from '~/lib/engine/deckStats'
import { DEFAULT_SPELL_TABLE } from '~/lib/engine/spellTable'
import { KINDS } from '~/lib/engine/types'

const { draftStats } = useDeck()

const ok = computed(() => draftStats.value.total === 99)

const groupColors: Record<string, string> = {
  lands: 'var(--k-land)',
  zeros: 'var(--k-zero)',
  rocks: 'var(--k-rock)',
  ones: 'var(--k-one)',
  twos: 'var(--k-two)',
  creatures: 'var(--k-creature)',
  others: 'var(--k-other)',
}

// Courbe : nombre de sorts de combo par coût (0..7+).
const curve = computed(() => {
  const buckets = [0, 0, 0, 0, 0, 0, 0, 0] // index = coût, 7 = "7+"
  for (const k of KINDS) {
    const p = DEFAULT_SPELL_TABLE[k]
    if (!p.isComboSpell) continue
    const n = draftStats.value.byKind[k]
    buckets[Math.min(p.cost, 7)]! += n
  }
  const max = Math.max(1, ...buckets)
  return buckets.map((n, cost) => ({ cost, n, pct: n / max }))
})
</script>

<template>
  <div class="agg">
    <div class="total" :class="{ warn: !ok }">
      <span class="num">{{ draftStats.total }}</span><span class="den">/ 99</span>
      <span v-if="!ok" class="warn-tag">⚠ total ≠ 99 (calcul valide, vérifie la liste)</span>
    </div>

    <div class="chips">
      <span
        v-for="g in GROUPS"
        :key="g.id"
        class="chip"
        :style="{ '--c': groupColors[g.id] }"
      >
        <i class="dot" />{{ g.label }}
        <b>{{ draftStats.byGroup[g.id] }}</b>
      </span>
    </div>

    <div class="curve">
      <div class="curve-title faint">Courbe des sorts de combo (par coût)</div>
      <div class="curve-bars">
        <div v-for="b in curve" :key="b.cost" class="cb">
          <div class="cb-bar" :style="{ height: `${Math.max(2, b.pct * 100)}%` }">
            <span class="cb-n">{{ b.n }}</span>
          </div>
          <span class="cb-lab">{{ b.cost === 7 ? '7+' : b.cost }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.agg {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.total {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}
.total .num {
  font-size: 30px;
  font-weight: 700;
  color: var(--good);
}
.total.warn .num {
  color: var(--accent);
}
.total .den {
  color: var(--text-faint);
  font-size: 15px;
}
.warn-tag {
  font-size: 12px;
  color: var(--accent);
  margin-left: 8px;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 12px;
  color: var(--text-dim);
}
.chip .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--c);
}
.chip b {
  color: var(--text);
}
.curve-title {
  font-size: 11px;
  margin-bottom: 4px;
}
.curve-bars {
  display: flex;
  gap: 6px;
  align-items: flex-end;
  height: 70px;
}
.cb {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}
.cb-bar {
  width: 100%;
  background: linear-gradient(180deg, var(--accent), #8a6a26);
  border-radius: 4px 4px 0 0;
  position: relative;
  min-height: 2px;
  display: flex;
  justify-content: center;
}
.cb-n {
  position: absolute;
  top: -15px;
  font-size: 10px;
  color: var(--text-dim);
}
.cb-lab {
  font-size: 10px;
  color: var(--text-faint);
  margin-top: 3px;
}
</style>
