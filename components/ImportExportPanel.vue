<script setup lang="ts">
import type { Kind } from '~/lib/engine/types'
import { KIND_META, KIND_OPTIONS } from '~/lib/ui/kinds'

const {
  unresolved,
  importMoxfield,
  importJson,
  exportText,
  exportJson,
  resolveUnresolved,
  dismissUnresolved,
} = useDeck()

const text = ref('')
const msg = ref('')
const resolveKind = reactive<Record<string, Kind>>({})

function doImportMoxfield() {
  try {
    importMoxfield(text.value)
    msg.value = unresolved.value.length
      ? `Importé. ${unresolved.value.length} carte(s) à catégoriser.`
      : 'Importé ✓'
  } catch (e) {
    msg.value = `Erreur : ${(e as Error).message}`
  }
}
function doImportJson() {
  try {
    importJson(text.value)
    msg.value = 'JSON importé ✓'
  } catch (e) {
    msg.value = `Erreur JSON : ${(e as Error).message}`
  }
}
function fillExportText() {
  text.value = exportText()
  msg.value = 'Liste texte (Moxfield) générée ci-dessus.'
}
function fillExportJson() {
  text.value = exportJson()
  msg.value = 'JSON interne généré ci-dessus.'
}
async function copy() {
  try {
    await navigator.clipboard.writeText(text.value)
    msg.value = 'Copié dans le presse-papier ✓'
  } catch {
    msg.value = 'Copie impossible (sélectionne et copie à la main).'
  }
}
</script>

<template>
  <div class="io">
    <textarea
      v-model="text"
      rows="6"
      aria-label="Zone d'import / export de decklist"
      placeholder="Colle ici une liste Moxfield (1 Nom (SET) 123) ou un JSON interne…"
    />
    <div class="io-actions">
      <button class="sm" @click="doImportMoxfield">Importer Moxfield</button>
      <button class="sm" @click="doImportJson">Importer JSON</button>
      <span class="sep" />
      <button class="sm ghost" @click="fillExportText">Exporter texte</button>
      <button class="sm ghost" @click="fillExportJson">Exporter JSON</button>
      <button class="sm ghost" @click="copy">Copier</button>
    </div>
    <p v-if="msg" class="msg faint">{{ msg }}</p>

    <div v-if="unresolved.length" class="unresolved">
      <h4>À catégoriser ({{ unresolved.length }})</h4>
      <ul>
        <li v-for="u in unresolved" :key="u.name">
          <span class="uname" :title="u.name">{{ u.name }}</span>
          <select v-model="resolveKind[u.name]" :aria-label="`Catégorie pour ${u.name}`">
            <option disabled value="">kind…</option>
            <option v-for="o in KIND_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
          <button
            class="sm"
            :disabled="!resolveKind[u.name]"
            @click="resolveUnresolved(u.name, resolveKind[u.name] as Kind)"
          >
            OK
          </button>
          <button class="sm ghost" @click="dismissUnresolved(u.name)">Ignorer</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.io-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.sep {
  width: 1px;
  height: 20px;
  background: var(--border);
  margin: 0 4px;
}
.msg {
  font-size: 12px;
  margin: 8px 0 0;
}
.unresolved {
  margin-top: 12px;
  border-top: 1px solid var(--border);
  padding-top: 8px;
}
.unresolved h4 {
  margin: 0 0 6px;
  font-size: 12px;
  color: var(--accent);
}
.unresolved ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.unresolved li {
  display: flex;
  gap: 6px;
  align-items: center;
}
.uname {
  flex: 1;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
