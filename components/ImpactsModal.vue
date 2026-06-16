<script setup lang="ts">
import type { Kind } from '~/lib/engine/types'
import { KIND_META } from '~/lib/ui/kinds'
import { REFERENCE_DECK } from '~/lib/engine/referenceDeck'
import { CARD_CATALOG } from '~/lib/io/cardCatalog'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const sim = useSim()

// Cartes connues par catégorie (référence + catalogue) pour illustrer chaque ligne.
const cardsByKind = computed(() => {
  const m = {} as Record<string, string[]>
  const add = (name: string, kind: string) => {
    ;(m[kind] ||= [])
    if (!m[kind]!.includes(name)) m[kind]!.push(name)
  }
  for (const c of REFERENCE_DECK.cards) add(c.name, c.kind)
  for (const [name, kind] of Object.entries(CARD_CATALOG)) add(name, kind)
  return m
})

const rows = computed(() =>
  (sim.impacts.value ?? []).map((i) => ({
    kind: i.kind as Kind,
    label: KIND_META[i.kind].full,
    cards: cardsByKind.value[i.kind] ?? [],
    t2: i.t2,
    t3: i.t3,
    t4: i.t4,
    t5: i.t5,
  })),
)

function cls(d: number): string {
  if (d > 0.0008) return 'pos'
  if (d < -0.0008) return 'neg'
  return 'neu'
}
function fmt(d: number): string {
  const v = d * 100
  const s = v.toFixed(1)
  return v > 0.05 ? `+${s}` : s
}
</script>

<template>
  <BaseModal :open="open" @close="emit('close')">
    <h2>Influence des cartes sur le combo</h2>
    <p class="intro faint">
      Effet (en points) de chaque <b>catégorie</b> de carte sur la probabilité de combo, par tour.
      Mesure marginale : on remplace une carte neutre par une carte de la catégorie, dans la
      <b>liste de référence</b>, et on lit le delta (moyenne play/draw, seed identique). C'est
      contextuel — juste pour situer le <b>sens</b> et l'<b>ordre de grandeur</b>. Toutes les cartes
      d'une même catégorie ont le même impact mécanique.
    </p>

    <div v-if="sim.impactsRunning.value && !rows.length" class="loading faint">
      Calcul en cours… {{ Math.round(sim.impactsProgress.value * 100) }} %
    </div>

    <table v-else-if="rows.length" class="impacts">
      <thead>
        <tr><th>Catégorie</th><th>T2</th><th>T3</th><th>T4</th><th>T5</th></tr>
      </thead>
      <tbody>
        <tr v-for="r in rows" :key="r.kind">
          <td class="cat">
            <span class="lbl">{{ r.label }}</span>
            <span v-if="r.cards.length" class="ex faint">{{ r.cards.slice(0, 4).join(', ')
              }}{{ r.cards.length > 4 ? `, +${r.cards.length - 4}` : '' }}</span>
          </td>
          <td :class="cls(r.t2)">{{ fmt(r.t2) }}</td>
          <td :class="['t3hot', cls(r.t3)]">{{ fmt(r.t3) }}</td>
          <td :class="cls(r.t4)">{{ fmt(r.t4) }}</td>
          <td :class="cls(r.t5)">{{ fmt(r.t5) }}</td>
        </tr>
      </tbody>
    </table>

    <p class="foot-note faint">
      Trié par effet sur T3. Valeurs en points (ex. +1,2 = +1,2 % de combos). ~0 = effet négligeable
      ou dans le bruit. « Sorts à 0 » sont la base : beaucoup en ont déjà, l'impact marginal d'un de
      plus est donc faible mais positif.
    </p>

    <div class="foot">
      <button class="primary" @click="emit('close')">Fermer</button>
    </div>
  </BaseModal>
</template>

<style scoped>
h2 {
  font-size: 18px;
  margin-bottom: 12px;
}
.intro {
  font-size: 12.5px;
  line-height: 1.55;
  margin: 0 0 14px;
}
.loading {
  padding: 28px 0;
  text-align: center;
  font-size: 13px;
}
.impacts {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}
.impacts th,
.impacts td {
  padding: 6px 8px;
  border-bottom: 1px solid var(--border);
  text-align: right;
  font-size: 12.5px;
}
.impacts th {
  color: var(--text-faint);
  font-size: 11px;
  font-weight: 600;
}
.impacts th:first-child,
.cat {
  text-align: left;
}
.cat .lbl {
  display: block;
  color: var(--text);
}
.cat .ex {
  display: block;
  font-size: 11px;
  margin-top: 1px;
}
.t3hot {
  background: #d9a4410f;
}
.pos {
  color: var(--good);
  font-weight: 600;
}
.neg {
  color: var(--bad);
  font-weight: 600;
}
.neu {
  color: var(--text-faint);
}
.foot-note {
  font-size: 11px;
  margin: 12px 0 0;
  line-height: 1.5;
}
.foot {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
