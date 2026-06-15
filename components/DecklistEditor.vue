<script setup lang="ts">
import { GROUPS } from '~/lib/engine/deckStats'
import type { Kind } from '~/lib/engine/types'
import { KIND_META, KIND_OPTIONS } from '~/lib/ui/kinds'

const { draft, draftStats, cut, add } = useDeck()

// Cartes groupées par catégorie, en gardant l'index d'origine (pour couper).
const grouped = computed(() =>
  GROUPS.map((g) => ({
    ...g,
    cards: draft.value.cards
      .map((c, i) => ({ c, i }))
      .filter((ci) => g.kinds.includes(ci.c.kind))
      .sort((a, b) => a.c.name.localeCompare(b.c.name)),
  })),
)

const newName = ref('')
const newKind = ref<Kind>('zero')
function addCard() {
  add(newName.value, newKind.value)
  newName.value = ''
}

// — Aperçu de carte au survol (image Scryfall, à la demande) —
const hoverName = ref<string | null>(null)
const px = ref(0)
const py = ref(0)
const imgError = ref(false)
let hoverTimer: ReturnType<typeof setTimeout> | null = null

function imgUrl(name: string): string {
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`
}
function onEnter(name: string, e: MouseEvent) {
  if (hoverTimer) clearTimeout(hoverTimer)
  px.value = e.clientX
  py.value = e.clientY
  // petit délai : évite de spammer Scryfall quand on balaie la liste
  hoverTimer = setTimeout(() => {
    imgError.value = false
    hoverName.value = name
  }, 140)
}
function onMove(e: MouseEvent) {
  px.value = e.clientX
  py.value = e.clientY
}
function onLeave() {
  if (hoverTimer) clearTimeout(hoverTimer)
  hoverName.value = null
}

const PREVIEW_W = 240
const PREVIEW_H = 335
const previewStyle = computed(() => {
  const pad = 12
  let left = px.value + 18
  if (left + PREVIEW_W > window.innerWidth - pad) left = px.value - PREVIEW_W - 18
  let top = py.value - PREVIEW_H / 2
  top = Math.max(pad, Math.min(top, window.innerHeight - PREVIEW_H - pad))
  return { left: `${left}px`, top: `${top}px`, width: `${PREVIEW_W}px` }
})
</script>

<template>
  <div class="editor">
    <div class="add-row">
      <input
        v-model="newName"
        aria-label="Nom de la carte à ajouter"
        placeholder="Nom de carte (optionnel)"
        @keyup.enter="addCard"
      />
      <select v-model="newKind" aria-label="Catégorie de la carte à ajouter">
        <option v-for="o in KIND_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <button class="sm" @click="addCard">+ Ajouter</button>
    </div>

    <div class="groups">
      <section v-for="g in grouped" :key="g.id" class="group">
        <header>
          <h3>{{ g.label }}</h3>
          <span class="sub">{{ draftStats.byGroup[g.id] }}</span>
        </header>
        <ul>
          <li
            v-for="ci in g.cards"
            :key="ci.i + ci.c.name"
            @mouseenter="onEnter(ci.c.name, $event)"
            @mousemove="onMove"
            @mouseleave="onLeave"
          >
            <span class="badge" :style="{ background: KIND_META[ci.c.kind].color }">
              {{ KIND_META[ci.c.kind].label }}
            </span>
            <span class="name" :title="ci.c.name">{{ ci.c.name }}</span>
            <button class="cut" title="Couper" @click="cut(ci.i)">−</button>
          </li>
          <li v-if="!g.cards.length" class="empty faint">—</li>
        </ul>
      </section>
    </div>

    <Teleport to="body">
      <div v-if="hoverName" class="card-preview" :style="previewStyle">
        <img v-show="!imgError" :src="imgUrl(hoverName)" :alt="hoverName" @error="imgError = true" />
        <div v-if="imgError" class="noimg">
          <strong>{{ hoverName }}</strong>
          <span>aperçu indisponible</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.add-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.add-row input {
  flex: 1 1 100%;
  min-width: 0;
}
.add-row select {
  flex: 1 1 0;
  min-width: 0; /* sans ça, le <select> s'élargit au texte de l'option et déborde */
}
.add-row button {
  flex: 0 0 auto;
}
.groups {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 58vh;
  overflow-y: auto;
  padding-right: 6px;
  margin-right: -4px;
}
.group header {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  padding: 2px 0 4px;
  margin-bottom: 4px;
  background: var(--bg-2);
}
.group h3 {
  font-size: 13px;
  color: var(--text-dim);
}
.group .sub {
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
  background: var(--bg-3);
  border-radius: 999px;
  padding: 1px 8px;
}
.group ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.group li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
}
.badge {
  width: 58px;
  justify-content: center;
  flex-shrink: 0;
  font-size: 10px;
}
.name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12.5px;
}
.cut {
  padding: 0 8px;
  line-height: 20px;
  color: var(--text-faint);
  border-color: transparent;
  background: transparent;
}
.cut:hover {
  color: var(--bad);
  border-color: var(--bad);
  background: transparent;
}
.empty {
  font-size: 12px;
}
.group li:hover {
  background: var(--bg-3);
  border-radius: 6px;
}

/* Aperçu de carte au survol (téléporté dans body) */
.card-preview {
  position: fixed;
  z-index: 1500;
  pointer-events: none;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);
  background: var(--bg-3);
}
.card-preview img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 12px;
}
.noimg {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  text-align: center;
  border: 1px solid var(--border);
  border-radius: 12px;
}
.noimg strong {
  font-size: 13px;
}
.noimg span {
  font-size: 11px;
  color: var(--text-faint);
}
</style>
