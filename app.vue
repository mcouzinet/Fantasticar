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

    <main class="grid">
      <!-- Colonne gauche : éditeur de decklist -->
      <section class="col left">
        <div class="card pad">
          <DeckAggregates />
        </div>
        <div class="card pad">
          <h2 class="ph">Decklist</h2>
          <DecklistEditor />
        </div>
        <div class="card pad">
          <h2 class="ph">Import / Export</h2>
          <ImportExportPanel />
        </div>
      </section>

      <!-- Colonne droite : simulation & stats -->
      <section class="col right">
        <div class="card pad">
          <h2 class="ph">Simulation</h2>
          <SimControls :running="sim.isRunning.value" :progress="sim.progress.value" @run="runSim" />
          <p v-if="sim.error.value" class="err">⚠ {{ sim.error.value }}</p>
        </div>

        <div class="card pad">
          <h2 class="ph">What-if — changement de carte</h2>
          <WhatIfPanel :running="sim.isRunning.value" @run="runSim" />
        </div>

        <div class="card pad">
          <h2 class="ph">
            Résultats
            <span v-if="compare" class="badge-soft">Δ vs référence</span>
          </h2>
          <template v-if="primary">
            <ResultsTable :primary="primary" :compare="compare" />
            <div class="chart">
              <ProbBars :on-play="primary.onPlay" :on-draw="primary.onDraw" />
            </div>
            <p class="combo-flavor faint">
              🛸 Au 4ᵉ sort non-créature du tour, on sacrifie The Fantasticar → <b>4 jetons 4/4</b>
              volants et hâtifs. Décollage visé&nbsp;: <b class="accent">T3</b>.
            </p>
          </template>
          <p v-else class="empty muted">
            Lance une simulation pour voir les probabilités T2→T5 (la cible est T3).
          </p>
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
  max-width: 1280px;
  margin: 0 auto;
  padding: 18px;
}
.topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
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
  font-size: 22px;
  letter-spacing: -0.01em;
}
.brand .accent {
  color: var(--accent);
}
.brand p {
  margin: 2px 0 0;
  font-size: 13px;
}
.grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  gap: 16px;
  align-items: start;
}
.col {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}
.card.pad {
  padding: 16px;
}
.ph {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-faint);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.badge-soft {
  font-size: 10px;
  font-weight: 600;
  color: var(--accent);
  background: rgba(217, 164, 65, 0.12);
  border-radius: 999px;
  padding: 2px 8px;
  text-transform: none;
  letter-spacing: 0;
}
.chart {
  margin-top: 16px;
}
.combo-flavor {
  font-size: 12px;
  line-height: 1.55;
  margin: 14px 0 0;
  padding-top: 12px;
  border-top: 1px dashed var(--border);
}
.empty {
  font-size: 13px;
  padding: 8px 0;
}
.err {
  color: var(--bad);
  font-size: 13px;
  margin: 10px 0 0;
}
.foot {
  margin-top: 20px;
  text-align: center;
  font-size: 11px;
}

@media (max-width: 880px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
