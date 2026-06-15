<script setup lang="ts">
const deck = useDeck()
const sim = useSim()

const helpOpen = useState('help:open', () => false)
const methodoOpen = useState('methodo:open', () => false)
const HELP_KEY = 'fantasticar.help.v1'

onMounted(() => {
  deck.restore()
  // popin d'aide au premier lancement
  try {
    if (!localStorage.getItem(HELP_KEY)) helpOpen.value = true
  } catch {
    /* mode privé : on ignore */
  }
})

function closeHelp() {
  helpOpen.value = false
  try {
    localStorage.setItem(HELP_KEY, '1')
  } catch {
    /* ignore */
  }
}

function runSim() {
  if (deck.isDirty.value) {
    sim.run(deck.baseline.value, deck.draft.value, sim.lastConfig.value)
  } else {
    sim.run(deck.draft.value, null, sim.lastConfig.value)
  }
}

// Résultat affiché = la variante de travail ; comparaison = la référence (si modifiée).
const primary = computed(() => sim.draftResult.value ?? sim.baselineResult.value)
const compare = computed(() => (sim.draftResult.value ? sim.baselineResult.value : null))
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <div class="brand">
        <FantasticarMark class="brand-mark" />
        <div>
          <h1>Fantasticar <span class="accent">Combo Lab</span></h1>
          <p class="muted">
            Probabilité de déclencher le combo (4 sorts non-créature / tour) — Duel Commander, goldfish.
          </p>
        </div>
      </div>
      <div class="topbar-actions">
        <button class="ghost sm" title="Aide" @click="helpOpen = true">Aide</button>
        <button class="ghost sm" title="Méthodologie & hypothèses" @click="methodoOpen = true">Méthodologie</button>
        <button class="ghost sm" title="Recharger la liste de référence" @click="deck.resetToReference()">
          ↺ Liste de référence
        </button>
      </div>
    </header>

    <main class="dash">
      <!-- ZONE DECK -->
      <section class="area-deck">
        <div class="card pad"><DeckAggregates /></div>
        <div class="card pad">
          <h2 class="ph">Decklist</h2>
          <DecklistEditor />
        </div>
        <details class="card pad io">
          <summary>Import / Export</summary>
          <div class="io-body"><ImportExportPanel /></div>
        </details>
      </section>

      <!-- ZONE WHAT-IF (à côté de la decklist quand la largeur le permet) -->
      <section class="area-whatif">
        <div class="card pad">
          <h2 class="ph">What-if — changement de carte</h2>
          <WhatIfPanel :running="sim.isRunning.value" @run="runSim" />
        </div>
      </section>

      <!-- ZONE RÉSULTATS : simulation + résultats (graphe sous le tableau) -->
      <section class="area-results">
        <div class="card pad">
          <SimControls :running="sim.isRunning.value" :progress="sim.progress.value" @run="runSim" />
          <p v-if="sim.error.value" class="err">⚠ {{ sim.error.value }}</p>
        </div>

        <div class="card pad results-card">
          <h2 class="ph">
            Résultats — combo par tour
            <span v-if="compare" class="badge-soft">Δ vs référence</span>
          </h2>
          <template v-if="primary">
            <ResultHero :primary="primary" :compare="compare" />
            <div class="result-table">
              <ResultsTable :primary="primary" :compare="compare" />
            </div>
            <div class="chart">
              <ProbBars :on-play="primary.onPlay" :on-draw="primary.onDraw" />
            </div>
            <p class="combo-flavor faint">
              🛸 Au 4ᵉ sort non-créature du tour, on sacrifie The Fantasticar → <b>4 jetons 4/4</b>
              volants et hâtifs. Décollage visé&nbsp;: <b class="accent">T3</b>.
            </p>
          </template>
          <div v-else class="empty muted">
            <FantasticarMark class="empty-mark" />
            <p>Configure le deck, choisis le mulligan, puis <b>lance la simulation</b> — le résultat s'affiche ici (T2→T5, cible&nbsp;T3).</p>
          </div>
        </div>
      </section>
    </main>

    <footer class="foot faint">
      Calcul 100 % client (Web Worker). Aucune donnée envoyée. — moteur testé contre les valeurs §7.
    </footer>

    <HelpModal :open="helpOpen" @close="closeHelp" />
    <MethodoModal :open="methodoOpen" @close="methodoOpen = false" />
  </div>
</template>

<style scoped>
.shell {
  width: 100%;
  margin: 0;
  padding: 20px 24px 36px;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
.topbar-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}
.brand-mark {
  flex-shrink: 0;
}
.brand h1 {
  font-size: 23px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.brand .accent {
  color: var(--accent);
}
.brand p {
  margin: 3px 0 0;
  font-size: 12.5px;
}

/* Dashboard pleine largeur : 3 zones (decklist · what-if · résultats).
   What-if à côté de la decklist quand la largeur le permet, sinon dessous. */
.dash {
  display: grid;
  grid-template-columns: 320px 320px minmax(0, 1fr);
  grid-template-areas: 'deck whatif results';
  gap: 16px;
  align-items: start;
}
.area-deck {
  grid-area: deck;
}
.area-whatif {
  grid-area: whatif;
}
.area-results {
  grid-area: results;
}
.area-deck,
.area-whatif,
.area-results {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}
.card.pad {
  padding: 16px;
}
.results-card {
  padding: 18px;
}
.ph {
  font-family: var(--font-display);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-faint);
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.badge-soft {
  font-size: 10px;
  font-weight: 600;
  color: var(--accent);
  background: rgba(224, 169, 63, 0.14);
  border-radius: 999px;
  padding: 2px 8px;
  text-transform: none;
  letter-spacing: 0;
}
/* Résultats en colonne : graphe sous le tableau ; contenu lisible (non étiré). */
.result-table {
  margin-top: 18px;
  max-width: 880px;
}
.chart {
  margin-top: 22px;
  max-width: 880px;
}
.combo-flavor {
  font-size: 12px;
  line-height: 1.55;
  margin: 16px 0 0;
  padding-top: 14px;
  border-top: 1px dashed var(--border);
}
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
  padding: 48px 24px;
  font-size: 14px;
  max-width: 460px;
  margin: 0 auto;
}
.empty-mark {
  width: 60px;
  height: 38px;
  opacity: 0.85;
}
.io > summary {
  cursor: pointer;
  font-family: var(--font-display);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-faint);
  user-select: none;
}
.io[open] > summary {
  margin-bottom: 12px;
}
.err {
  color: var(--bad);
  font-size: 13px;
  margin: 10px 0 0;
}
.foot {
  margin-top: 24px;
  text-align: center;
  font-size: 11px;
}

/* Pas la place pour 3 colonnes : what-if repasse SOUS la decklist. */
@media (max-width: 1300px) {
  .dash {
    grid-template-columns: 320px minmax(0, 1fr);
    grid-template-areas:
      'deck   results'
      'whatif results';
  }
}
/* Étroit : tout empilé, résultats en premier. */
@media (max-width: 920px) {
  .dash {
    grid-template-columns: 1fr;
    grid-template-areas:
      'results'
      'deck'
      'whatif';
  }
}
</style>
