<script setup lang="ts">
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const steps = [
  {
    title: 'La decklist',
    body: 'Édite la liste à gauche : ajoute une carte (nom + catégorie) ou coupe-en une avec le bouton −. Tu peux aussi charger une liste Moxfield ou un JSON via « Import / Export ». Le compteur 100/100 t’avertit si le total dérive.',
  },
  {
    title: 'La simulation',
    body: 'Choisis le mode de mulligan (Aucun / London / Moxfield) et la précision, puis « Lancer la simulation ». Tu obtiens la probabilité de déclencher le combo par tour, de T2 à T5 — la cible du deck est T3.',
  },
  {
    title: 'Tester un changement',
    body: 'Ajuste la variante avec les steppers de catégorie (ils gardent le total à 100), puis « Comparer ». Chaque résultat affiche alors son écart vs la liste de référence. « Définir comme référence » fige la variante courante.',
  },
]
</script>

<template>
  <BaseModal :open="open" @close="emit('close')">
    <h2>Fantasticar <span class="accent">Combo Lab</span> — comment ça marche</h2>
    <p class="intro muted">
      Estime par Monte Carlo la probabilité de déclencher le combo (4 sorts non-créature dans
      un tour) et compare l’effet d’un changement de carte.
    </p>
    <ol class="steps">
      <li v-for="s in steps" :key="s.title">
        <strong>{{ s.title }}</strong>
        <p>{{ s.body }}</p>
      </li>
    </ol>
    <div class="foot">
      <button class="primary" @click="emit('close')">C’est parti</button>
    </div>
  </BaseModal>
</template>

<style scoped>
h2 {
  font-size: 19px;
  margin-bottom: 6px;
}
.accent {
  color: var(--accent);
}
.intro {
  font-size: 13px;
  margin: 0 0 18px;
}
.steps {
  list-style: none;
  counter-reset: step;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.steps li {
  counter-increment: step;
  position: relative;
  padding-left: 34px;
}
.steps li::before {
  content: counter(step);
  position: absolute;
  left: 0;
  top: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--accent);
  color: #1a1205;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.steps strong {
  font-size: 14px;
}
.steps p {
  margin: 3px 0 0;
  font-size: 13px;
  color: var(--text-dim);
}
.foot {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}
</style>
