<script setup lang="ts">
const open = ref(false)
</script>

<template>
  <details class="methodo" :open="open" @toggle="open = ($event.target as HTMLDetailsElement).open">
    <summary>Méthodologie & hypothèses</summary>
    <div class="body">
      <ul>
        <li><b>Goldfish</b> : aucun adversaire, aucune interaction. Les probabilités sont des bornes hautes vs le jeu réel.</li>
        <li>Sorts à coût variable joués à <b>X = 0</b> (Chalice, Engineered Explosives, Astral Cornucopia…).</li>
        <li><b>Urza's Saga</b> traité comme un terrain simple ; <b>Tron</b> non assemblé (1 mana par terrain Urza).</li>
        <li><b>Gemstone Caverns / Scorched Ruins</b> modélisés comme terrains standards (conservateur).</li>
        <li>Les <b>baubles ne piochent pas</b> et <b>Chromatic</b> n'est sacrifié que pour le mana (effet « creuser » ignoré).</li>
        <li>
          Calcul Monte Carlo par <b>Web Worker</b> ; deux runs (référence / variante) à seed identique pour
          des deltas peu bruités. Bruit MC ≈ ±1 pt à 10 000 itérations, ±0,5 pt à 40 000.
        </li>
        <li class="faint">
          Le moteur reproduit les valeurs de référence à ~3 pt près sur les extrêmes (heuristique de
          développement « raisonnable », cf. §2/§3.5). Les <b>deltas</b> du what-if, eux, ne sont pas
          affectés par cet offset.
        </li>
      </ul>
    </div>
  </details>
</template>

<style scoped>
.methodo {
  font-size: 12px;
}
.methodo summary {
  cursor: pointer;
  color: var(--text-dim);
  user-select: none;
}
.methodo .body {
  margin-top: 8px;
}
.methodo ul {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: var(--text-dim);
}
</style>
