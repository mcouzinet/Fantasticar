<script setup lang="ts">
import type { Kind } from '~/lib/engine/types'
import { KIND_META } from '~/lib/ui/kinds'
import { REFERENCE_DECK } from '~/lib/engine/referenceDeck'
import { CARD_CATALOG } from '~/lib/io/cardCatalog'

const sim = useSim()

onMounted(() => {
  sim.runImpacts(sim.lastConfig.value) // calcul à la demande (mis en cache)
})

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
const maxAbs = computed(() => rows.value.reduce((m, r) => Math.max(m, Math.abs(r.t3)), 0) || 1)

function cls(d: number): string {
  if (d > 0.0008) return 'pos'
  if (d < -0.0008) return 'neg'
  return 'neu'
}
function fmt(d: number): string {
  const v = d * 100
  return v > 0.05 ? `+${v.toFixed(1)}` : v.toFixed(1)
}
function barStyle(t3: number) {
  const w = (Math.abs(t3) / maxAbs.value) * 50
  return t3 >= 0 ? { left: '50%', width: `${w}%` } : { right: '50%', width: `${w}%` }
}
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <NuxtLink to="/" class="back">← Retour au labo</NuxtLink>
      <div class="right">
        <a class="src" href="https://github.com/mcouzinet/Fantasticar" target="_blank" rel="noopener noreferrer">GitHub</a>
        <BuyMeCoffee />
      </div>
    </header>

    <div class="wrap">
      <h1>Influence des cartes <span class="accent">sur le combo</span></h1>
      <p class="lede">
        Effet de chaque <b>catégorie de carte</b> sur la probabilité de déclencher le combo, tour par
        tour (T2 → T5). Mesure marginale : on remplace une carte neutre par une carte de la catégorie,
        dans la <b>liste de référence</b>, et on lit le delta — moyenne play/draw, à seed identique
        (deltas peu bruités). C'est <b>contextuel</b> (ça dépend du reste du deck) : à lire comme le
        <b>sens</b> et l'<b>ordre de grandeur</b> de l'effet. Toutes les cartes d'une même catégorie
        ont le même impact mécanique.
      </p>

      <div v-if="sim.impactsRunning.value && !rows.length" class="loading">
        <div class="spin" />
        Calcul de l'influence… {{ Math.round(sim.impactsProgress.value * 100) }} %
      </div>

      <div v-else-if="rows.length" class="card pad">
        <div class="thead">
          <span class="h-cat">Catégorie</span>
          <span class="h-num">T2</span>
          <span class="h-num h-hot">T3</span>
          <span class="h-num">T4</span>
          <span class="h-num">T5</span>
          <span class="h-bar">effet T3 (points)</span>
        </div>
        <ul class="list">
          <li v-for="r in rows" :key="r.kind">
            <span class="cat">
              <span class="lbl">{{ r.label }}</span>
              <span v-if="r.cards.length" class="ex faint">{{ r.cards.slice(0, 5).join(' · ')
                }}{{ r.cards.length > 5 ? ` · +${r.cards.length - 5}` : '' }}</span>
            </span>
            <span class="num" :class="cls(r.t2)">{{ fmt(r.t2) }}</span>
            <span class="num hot" :class="cls(r.t3)">{{ fmt(r.t3) }}</span>
            <span class="num" :class="cls(r.t4)">{{ fmt(r.t4) }}</span>
            <span class="num" :class="cls(r.t5)">{{ fmt(r.t5) }}</span>
            <span class="dbar">
              <span class="dbar-axis" />
              <span class="dbar-fill" :class="r.t3 >= 0 ? 'pos' : 'neg'" :style="barStyle(r.t3)" />
            </span>
          </li>
        </ul>
      </div>

      <p class="note faint">
        Valeurs en points de pourcentage (ex. <b>+1,2</b> = +1,2 % de combos). <span class="pos">Vert</span> =
        aide, <span class="neg">rouge</span> = pénalise, ~0 = négligeable (ou dans le bruit). Trié par
        effet sur le <b>T3</b> (la cible du deck). Les « sorts à 0 » sont la base du combo : on en a
        déjà beaucoup, donc l'impact marginal d'un de plus est faible mais positif. À l'inverse,
        Sol Talisman pénalise un peu le T3 (dilution) mais paie au T4 (suspend).
      </p>
    </div>
  </div>
</template>

<style scoped>
.shell {
  width: 100%;
  padding: 16px 24px 48px;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 14px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--border);
}
.right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.back,
.src {
  font-size: 13px;
  color: var(--text-dim);
  text-decoration: none;
}
.back:hover,
.src:hover {
  color: var(--text);
}
.wrap {
  max-width: 1080px;
  margin: 0 auto;
}
h1 {
  font-family: var(--font-display);
  font-size: 26px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 18px 0 10px;
}
h1 .accent {
  color: var(--accent);
}
.lede {
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--text-dim);
  margin: 0 0 22px;
  max-width: 820px;
}
.lede b {
  color: var(--text);
}
.loading {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  padding: 64px 0;
  font-size: 14px;
  color: var(--text-dim);
}
.spin {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.card.pad {
  padding: 8px 18px;
}
.thead,
.list li {
  display: grid;
  grid-template-columns: minmax(240px, 2fr) 56px 56px 56px 56px minmax(200px, 1.4fr);
  align-items: center;
  gap: 12px;
}
.thead {
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-faint);
}
.h-num {
  text-align: right;
}
.h-hot {
  color: var(--accent);
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.list li {
  padding: 9px 0;
  border-bottom: 1px solid var(--border);
}
.list li:last-child {
  border-bottom: none;
}
.cat .lbl {
  display: block;
  font-size: 13px;
  color: var(--text);
}
.cat .ex {
  display: block;
  font-size: 11px;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.num {
  text-align: right;
  font-family: var(--font-mono);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.num.hot {
  font-weight: 700;
}
.pos {
  color: var(--good);
}
.neg {
  color: var(--bad);
}
.neu {
  color: var(--text-faint);
}
/* barre divergente : axe au centre, remplissage à droite (vert +) ou gauche (rouge −) */
.dbar {
  position: relative;
  height: 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
}
.dbar-axis {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--border);
}
.dbar-fill {
  position: absolute;
  top: 0;
  bottom: 0;
}
.dbar-fill.pos {
  background: var(--good);
}
.dbar-fill.neg {
  background: var(--bad);
}
.note {
  font-size: 12px;
  line-height: 1.6;
  margin: 18px 0 0;
  max-width: 820px;
}
.note .pos {
  font-weight: 600;
}
.note .neg {
  font-weight: 600;
}
@media (max-width: 720px) {
  .thead .h-bar {
    display: none;
  }
  .thead,
  .list li {
    grid-template-columns: minmax(140px, 2fr) 44px 44px 44px 44px;
  }
  .dbar {
    display: none;
  }
}
</style>
