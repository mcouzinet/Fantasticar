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
      <li>Terrains : Urza's Saga traité comme un terrain simple, <b>Tron non assemblé</b>, Gemstone Caverns / Scorched Ruins en terrains standards (conservateur).</li>
      <li>Effets ignorés (conservateur) : les baubles ne piochent pas, Chromatic n'est sacrifié que pour le mana, le doublement de mana de Forsaken Monument est ignoré.</li>
      <li><b>Suspend</b> modélisé : une carte suspendue se résout N tours plus tard (ex. Sol Talisman ~T4) et compte alors comme un sort gratuit. Chaque caillou produit son mana réel.</li>
      <li class="faint">Le moteur reproduit les valeurs de référence connues à <b>~3 pt</b> près sur les extrêmes ; les <b>deltas</b> du what-if ne sont pas affectés par cet écart.</li>
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
