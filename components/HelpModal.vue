<script setup lang="ts">
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const steps = [
  {
    icon: '📋',
    title: 'Éditer la decklist (à gauche)',
    body: 'Ajoute une carte avec le champ nom + le sélecteur de catégorie, coupe-en une avec le bouton −. Le compteur 99/99 t’avertit si le total dérive.',
  },
  {
    icon: '⬇️',
    title: 'Charger une liste',
    body: 'Dans « Import / Export », colle une liste Moxfield (1 Nom (SET) 123) ou un JSON interne, puis « Importer ». Les cartes inconnues tombent dans une file « à catégoriser ».',
  },
  {
    icon: '🎲',
    title: 'Lancer une simulation (à droite)',
    body: 'Choisis le mode de mulligan (Aucun / London / Moxfield) et la précision, puis « Lancer la simulation ». Tu obtiens la probabilité de combo par tour T2→T5 (la cible est T3).',
  },
  {
    icon: '🔀',
    title: 'Tester un changement (what-if)',
    body: 'Modifie la variante (steppers +/−, couper/ajouter) puis « Comparer » pour voir le delta vs la référence. « Définir comme référence » fige la variante courante.',
  },
  {
    icon: '🖼️',
    title: 'Astuce',
    body: 'Survole le nom d’une carte pour afficher son image. Le détail des hypothèses est dans « Méthodologie & hypothèses » en bas à droite.',
  },
]
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="overlay" @click.self="emit('close')">
      <div class="modal card" role="dialog" aria-modal="true" aria-label="Aide">
        <button class="x" aria-label="Fermer" @click="emit('close')">×</button>
        <h2>Fantasticar <span class="accent">Combo Lab</span> — comment ça marche</h2>
        <p class="muted intro">
          Estime par Monte Carlo la probabilité de déclencher le combo (4 sorts non-créature
          dans un tour) et compare l’effet d’un changement de carte.
        </p>
        <ul class="steps">
          <li v-for="s in steps" :key="s.title">
            <span class="ic">{{ s.icon }}</span>
            <div>
              <strong>{{ s.title }}</strong>
              <p>{{ s.body }}</p>
            </div>
          </li>
        </ul>
        <div class="foot">
          <button class="primary" @click="emit('close')">C’est parti</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 7, 10, 0.66);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}
.modal {
  position: relative;
  max-width: 540px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  padding: 26px 26px 20px;
}
.modal h2 {
  font-size: 19px;
  margin-bottom: 6px;
}
.accent {
  color: var(--accent);
}
.intro {
  font-size: 13px;
  margin: 0 0 16px;
}
.x {
  position: absolute;
  top: 12px;
  right: 12px;
  border: none;
  background: transparent;
  color: var(--text-faint);
  font-size: 22px;
  line-height: 1;
  padding: 2px 8px;
}
.x:hover {
  color: var(--text);
  background: transparent;
}
.steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.steps li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.steps .ic {
  font-size: 20px;
  line-height: 1.3;
  flex-shrink: 0;
}
.steps strong {
  font-size: 13.5px;
}
.steps p {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--text-dim);
}
.foot {
  margin-top: 22px;
  display: flex;
  justify-content: flex-end;
}
</style>
