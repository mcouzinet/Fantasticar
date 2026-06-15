<script setup lang="ts">
const deck = useDeck()
const sim = useSim()

onMounted(() => deck.restore())

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
        <h1>Fantasticar <span class="accent">Combo Lab</span></h1>
        <p class="muted">
          Probabilité de déclencher le combo (4 sorts non-créature / tour) — Duel Commander, goldfish.
        </p>
      </div>
      <button class="ghost sm" title="Recharger la liste de référence" @click="deck.resetToReference()">
        ↺ Liste de référence
      </button>
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
          </template>
          <p v-else class="empty muted">
            Lance une simulation pour voir les probabilités T2→T5 (la cible est T3).
          </p>
        </div>

        <div class="card pad">
          <MethodoNote />
        </div>
      </section>
    </main>

    <footer class="foot faint">
      Calcul 100 % client (Web Worker). Aucune donnée envoyée. — moteur testé contre les valeurs §7.
    </footer>
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
