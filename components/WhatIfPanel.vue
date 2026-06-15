<script setup lang="ts">
import { GROUPS, type GroupId } from '~/lib/engine/deckStats'

const props = defineProps<{ running: boolean }>()
const emit = defineEmits<{ run: [] }>()

const { isDirty, draftStats, setDraftAsBaseline, resetDraft, stepCategory } = useDeck()

const counterpart = ref<GroupId>('others')
</script>

<template>
  <div class="whatif">
    <div class="status">
      <span v-if="isDirty" class="tag dirty">● Variante modifiée</span>
      <span v-else class="tag clean faint">Variante = référence</span>
    </div>

    <div class="actions">
      <button class="primary sm" :disabled="props.running" @click="emit('run')">⇄ Comparer</button>
      <button class="sm" :disabled="!isDirty" @click="setDraftAsBaseline">Définir comme référence</button>
      <button class="sm ghost" :disabled="!isDirty" @click="resetDraft">Réinitialiser</button>
    </div>

    <div class="steppers">
      <div class="cp">
        <label for="cp-select" class="faint">Contrepartie&nbsp;:</label>
        <select id="cp-select" v-model="counterpart">
          <option v-for="g in GROUPS" :key="g.id" :value="g.id">{{ g.label }}</option>
        </select>
      </div>
      <div class="step-grid">
        <div
          v-for="g in GROUPS"
          :key="g.id"
          class="step"
          :class="{ off: g.id === counterpart }"
        >
          <span class="lbl">{{ g.label }}</span>
          <span class="cnt">{{ draftStats.byGroup[g.id] }}</span>
          <span class="btns">
            <button
              class="sm"
              :disabled="g.id === counterpart || draftStats.byGroup[counterpart] < 1"
              title="+1 (compensé sur la contrepartie)"
              @click="stepCategory(g.id, 1, counterpart)"
            >+</button>
            <button
              class="sm"
              :disabled="g.id === counterpart || draftStats.byGroup[g.id] < 1"
              title="−1 (rendu à la contrepartie)"
              @click="stepCategory(g.id, -1, counterpart)"
            >−</button>
          </span>
        </div>
      </div>
      <p class="hint faint">
        Les +/− gardent le total à 99 en échangeant avec la contrepartie. Lance « Comparer »
        pour voir le delta.
      </p>
    </div>
  </div>
</template>

<style scoped>
.whatif {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.tag {
  font-size: 12px;
  font-weight: 600;
}
.tag.dirty {
  color: var(--accent);
}
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.cp {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
}
.step-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 6px;
}
.step {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 4px 8px;
}
.step.off {
  opacity: 0.45;
}
.step .lbl {
  flex: 1;
  font-size: 12px;
  color: var(--text-dim);
}
.step .cnt {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.step .btns {
  display: flex;
  gap: 3px;
}
.step .btns button {
  padding: 0 7px;
  line-height: 18px;
}
.hint {
  font-size: 11px;
  margin: 4px 0 0;
}
</style>
