<script setup lang="ts">
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <BaseModal :open="open" @close="emit('close')">
    <h2>Méthodologie & hypothèses</h2>
    <ul class="methodo">
      <li><b>Goldfish</b> : aucun adversaire ni interaction. Les probabilités sont des bornes hautes par rapport au jeu réel.</li>
      <li>Calcul <b>Monte Carlo en Web Worker</b> ; référence et variante tournent à <b>seed identique</b> pour des deltas peu bruités. Bruit ≈ ±1 pt à 10 000 itérations, ±0,5 pt à 40 000.</li>
      <li>Catégorisation des cartes (coût, type, production de mana) <b>vérifiée sur Scryfall</b>.</li>
      <li>Sorts à coût variable joués à <b>X = 0</b> (Everflowing Chalice, Engineered Explosives, Astral Cornucopia, Kozilek's Command…).</li>
      <li>Terrains modélisés finement : <b>City of Traitors</b> (2 mana récurrents), <b>Crystal Vein</b> (1/tour ou sacrifice pour 2), <b>Scorched Ruins</b> (sacrifie 2 terrains → 4), <b>Tron</b> Urza + Planar Nexus, terrains à <b>scry/surveil</b>, Maze of Ith (0 mana sauf donneur de type).</li>
      <li>Autres mécaniques : <b>Jeweled Amulet</b> banque 1 mana, <b>Chromatic/Relic</b> comptent comme des sorts à 1 nets (pas des rembourseurs gratuits), <b>Suspend</b> (Sol Talisman ~T4) compte comme un sort gratuit à la résolution. Chaque caillou produit son mana réel.</li>
      <li>Le Fantasticar (zone de commandement) se lance le <b>tour du combo</b> avec les 3 autres sorts (jamais pré-lancé). Effets ignorés (conservateur) : la pioche des baubles, le doublement de mana de Forsaken Monument, les créatures-mana (Metalworker…).</li>
    </ul>
    <div class="foot">
      <button class="primary" @click="emit('close')">Fermer</button>
    </div>
  </BaseModal>
</template>

<style scoped>
h2 {
  font-size: 18px;
  margin-bottom: 14px;
}
.methodo {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  font-size: 13px;
  color: var(--text-dim);
  line-height: 1.5;
}
.methodo b {
  color: var(--text);
}
.foot {
  margin-top: 22px;
  display: flex;
  justify-content: flex-end;
}
</style>
