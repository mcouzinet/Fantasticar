<script setup lang="ts">
// Page de référence : les 31 « cheerios » — artefacts jouables pour 0 mana (coût {0}, ou
// {X}/{X}{X}/{X}{X}{X} lancés avec X=0). Chacun compte comme un sort non-créature gratuit du tour.
//
// « Note d'utilité » : dans NOTRE modèle ils sont tous équivalents (un sort à 0 = +1 au compteur).
// La note reflète donc la valeur RÉELLE en deck au-delà du simple compteur (pioche, mana, upside,
// ou au contraire un {X} qui ne fait rien à X=0). Tri par pertinence décroissante.
interface Cheerio {
  name: string
  score: number // 5..1 — pertinence dans le deck (cf. SCORE_LABEL)
}

// Classement fourni (du meilleur au pire), regroupé par tier.
const CHEERIOS: Cheerio[] = [
  // 5 — Incontournable : du mana vers le combo.
  { name: 'Jeweled Amulet', score: 5 },
  { name: 'Everflowing Chalice', score: 5 },
  // 4 — Très bon.
  { name: "Mishra's Bauble", score: 4 },
  { name: "Urza's Bauble", score: 4 },
  { name: 'Welding Jar', score: 4 },
  // 3 — Ok.
  { name: 'Dark Sphere', score: 3 },
  { name: 'Chalice of the Void', score: 3 },
  { name: 'Lodestone Bauble', score: 3 },
  { name: "Tormod's Crypt", score: 3 },
  { name: 'Astral Cornucopia', score: 3 },
  { name: "Briber's Purse", score: 3 },
  { name: 'Fountain of Youth', score: 3 },
  { name: 'Chimeric Mass', score: 3 },
  { name: 'Clown Car', score: 3 },
  { name: 'Orochi Hatchery', score: 3 },
  // 2 — Anecdotique.
  { name: 'Darksteel Relic', score: 2 },
  { name: 'Zuran Orb', score: 2 },
  { name: 'Engineered Explosives', score: 2 },
  { name: "Accorder's Shield", score: 2 },
  { name: 'Bone Saw', score: 2 },
  { name: "Cathar's Shield", score: 2 },
  { name: 'Claws of Gix', score: 2 },
  { name: "Delif's Cone", score: 2 },
  { name: "Gustha's Scepter", score: 2 },
  { name: 'Herbal Poultice', score: 2 },
  { name: 'Kite Shield', score: 2 }, // oublié dans la liste fournie — rangé avec les autres boucliers
  { name: 'Paradise Mantle', score: 2 },
  { name: 'Spidersilk Net', score: 2 },
  { name: 'Sigil of Distinction', score: 2 },
  // 1 — Remplissage.
  { name: 'Mox Jasper', score: 1 },
  { name: 'Spellbook', score: 1 },
]

const SCORE_LABEL: Record<number, string> = {
  5: 'Incontournable',
  4: 'Très bon',
  3: 'Ok',
  2: 'Anecdotique',
  1: 'Remplissage',
}

// Tri par pertinence décroissante en conservant l'ordre fourni au sein d'un tier.
const sorted = CHEERIOS.map((c, i) => ({ ...c, i })).sort((a, b) => b.score - a.score || a.i - b.i)

// Pseudo-cheerios : pas {0}, mais ≈ gratuits pour le combo (mana rendu le tour même, ou affinité).
interface Pseudo {
  name: string
  note: string
}
const PSEUDO_GROUPS: { title: string; items: Pseudo[] }[] = [
  {
    title: 'Monolithes — le mana investi revient le tour même',
    items: [
      { name: 'Basalt Monolith', note: '{3} → tape {C}{C}{C} le tour même · net 0' },
      { name: 'Grim Monolith', note: '{2} → tape {C}{C}{C} le tour même · net +1' },
      { name: 'Mana Vault', note: '{1} → tape {C}{C}{C} le tour même · net +2' },
    ],
  },
  {
    title: 'Affinité aux artefacts — ≈ {0} avec assez d’artefacts en jeu',
    items: [
      { name: 'Scale of Chiss-Goria', note: '{3}, affinité aux artefacts' },
      { name: 'Tooth of Chiss-Goria', note: '{3}, affinité aux artefacts' },
      { name: 'Cranial Plating', note: '{2}, affinité aux artefacts (équipement)' },
    ],
  },
]
const ALL_NAMES = [
  ...CHEERIOS.map((c) => c.name),
  ...PSEUDO_GROUPS.flatMap((g) => g.items.map((p) => p.name)),
]

// Images : on résout les 31 cartes en UNE seule requête « cards/collection » (méthode
// recommandée par Scryfall). Elle renvoie des URLs du CDN, NON rate-limitées — contrairement
// à 31 appels « named » en parallèle qui se faisaient jeter (429 → repli céréales).
const FALLBACK = '/cherrios.png'
const imgByName = ref<Record<string, string>>({})
onMounted(async () => {
  const map: Record<string, string> = {}
  try {
    const res = await fetch('https://api.scryfall.com/cards/collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifiers: ALL_NAMES.map((name) => ({ name })) }),
    })
    const data = await res.json()
    for (const card of data?.data ?? []) {
      const uri = card?.image_uris?.normal ?? card?.card_faces?.[0]?.image_uris?.normal
      if (uri) map[card.name] = uri
    }
  } catch {
    /* hors-ligne / Scryfall indispo : on tombera sur le motif céréales */
  }
  // Tout ce qui manque → motif céréales (repli thématique).
  for (const name of ALL_NAMES) if (!map[name]) map[name] = FALLBACK
  imgByName.value = map
})
function imgUrl(name: string) {
  return imgByName.value[name] ?? FALLBACK
}
function scryfallUrl(name: string) {
  return `https://scryfall.com/search?q=${encodeURIComponent('!"' + name + '"')}`
}
// Repli thématique si une image ne charge pas : le motif de céréales.
function onImgError(e: Event) {
  const img = e.target as HTMLImageElement
  if (img.dataset.fallback) return
  img.dataset.fallback = '1'
  img.src = '/cherrios.png'
  img.classList.add('is-fallback')
}

// Aperçu agrandi de la carte qui suit le curseur (desktop).
const PREVIEW_W = 300
const PREVIEW_H = Math.round((PREVIEW_W * 680) / 488)
const preview = ref<{ name: string; x: number; y: number } | null>(null)
function showPreview(name: string, e: MouseEvent) {
  preview.value = { name, x: e.clientX, y: e.clientY }
}
function movePreview(e: MouseEvent) {
  if (preview.value) preview.value = { ...preview.value, x: e.clientX, y: e.clientY }
}
function hidePreview() {
  preview.value = null
}
const previewStyle = computed(() => {
  const p = preview.value
  if (!p) return {}
  const pad = 16
  const vw = window.innerWidth
  const vh = window.innerHeight
  let left = p.x + 24
  if (left + PREVIEW_W + pad > vw) left = p.x - PREVIEW_W - 24
  left = Math.max(pad, left)
  let top = Math.min(Math.max(pad, p.y - PREVIEW_H / 2), vh - PREVIEW_H - pad)
  return { left: `${left}px`, top: `${top}px`, width: `${PREVIEW_W}px` }
})
</script>

<template>
  <div class="shell">
    <div class="cereal-bg" aria-hidden="true" />
    <AppNav />

    <div class="wrap">
      <h1>Les <span class="accent">cheerios</span> <span class="count">· {{ sorted.length }}</span></h1>
      <p class="lede">
        Les « cheerios » sont les artefacts jouables pour <b>0 mana</b> — coût <code>{0}</code>, ou
        <code>{X}</code> lancés avec <b>X=0</b>. Chacun compte comme un sort non-créature
        <b>gratuit</b> du tour : ce sont les briques qui font monter le compteur vers le 4ᵉ sort.
        La <b>note</b> reflète leur intérêt <i>réel en deck</i> (pioche, mana, upside…) — dans le
        moteur, eux, sont tous équivalents. Triés par pertinence.
      </p>

      <ul class="list">
        <li
          v-for="c in sorted"
          :key="c.name"
          class="row"
          :class="`tier-${c.score}`"
          @mouseenter="showPreview(c.name, $event)"
          @mousemove="movePreview"
          @mouseleave="hidePreview"
        >
          <img
            v-if="imgByName[c.name]"
            class="thumb"
            :class="{ 'is-fallback': imgByName[c.name] === FALLBACK }"
            :src="imgUrl(c.name)"
            :alt="c.name"
            loading="lazy"
            referrerpolicy="no-referrer"
            @error="onImgError"
          />
          <span v-else class="thumb thumb-ph" aria-hidden="true" />
          <a class="name" :href="scryfallUrl(c.name)" target="_blank" rel="noopener noreferrer">{{ c.name }}</a>
          <span class="stars" :aria-label="`${c.score} sur 5`">
            <span v-for="n in 5" :key="n" :class="n <= c.score ? 'on' : 'off'">★</span>
          </span>
          <span class="tag">{{ SCORE_LABEL[c.score] }}</span>
          <span class="score"><b>{{ c.score }}</b><span class="slash">/5</span></span>
        </li>
      </ul>

      <h2 class="sub">Les <span class="accent">pseudo-cheerios</span></h2>
      <p class="lede">
        Pas <code>{0}</code>, mais <b>≈ gratuits</b> pour le combo : soit le mana investi <b>revient le
        tour même</b> (monolithes), soit l'<b>affinité aux artefacts</b> les rend quasi gratuits dans un
        deck plein d'artefacts. Ils comptent eux aussi comme un sort non-créature du tour.
      </p>

      <template v-for="g in PSEUDO_GROUPS" :key="g.title">
        <h3 class="grp">{{ g.title }}</h3>
        <ul class="list">
          <li
            v-for="p in g.items"
            :key="p.name"
            class="prow"
            @mouseenter="showPreview(p.name, $event)"
            @mousemove="movePreview"
            @mouseleave="hidePreview"
          >
            <img
              v-if="imgByName[p.name]"
              class="thumb"
              :class="{ 'is-fallback': imgByName[p.name] === FALLBACK }"
              :src="imgUrl(p.name)"
              :alt="p.name"
              loading="lazy"
              referrerpolicy="no-referrer"
              @error="onImgError"
            />
            <span v-else class="thumb thumb-ph" aria-hidden="true" />
            <span class="pinfo">
              <a class="name" :href="scryfallUrl(p.name)" target="_blank" rel="noopener noreferrer">{{ p.name }}</a>
              <span class="pnote">{{ p.note }}</span>
            </span>
          </li>
        </ul>
      </template>

      <img
        v-if="preview"
        class="hover-preview"
        :src="imgUrl(preview.name)"
        :style="previewStyle"
        alt=""
        referrerpolicy="no-referrer"
      />

      <p class="note faint">
        Images & données : <a href="https://scryfall.com" target="_blank" rel="noopener noreferrer">Scryfall</a>.
        Les coûts <code>{X}</code> sont lancés à X=0. Clique un nom pour ouvrir la carte.
      </p>
    </div>
  </div>
</template>

<style scoped>
.shell {
  position: relative;
  width: 100%;
  padding: 16px 24px 48px;
}
/* La blague : un mur de céréales en fond, très discret derrière l'UI sombre. */
.cereal-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image: url('/cherrios.png');
  background-size: 230px;
  background-repeat: repeat;
  opacity: 0.2;
}
.wrap {
  max-width: 720px;
  margin: 0 auto;
}
h1 {
  font-family: var(--font-display);
  font-size: 24px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 14px 0 8px;
}
h1 .accent {
  color: var(--accent);
}
h1 .count {
  color: var(--text-faint);
  font-size: 18px;
}
.lede {
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--text-dim);
  margin: 0 0 22px;
  max-width: 840px;
}
.lede b {
  color: var(--text);
}
code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  color: var(--accent);
}
.sub {
  font-family: var(--font-display);
  font-size: 20px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 38px 0 8px;
  padding-top: 26px;
  border-top: 1px solid var(--border);
}
.sub .accent {
  color: var(--accent);
}
.grp {
  font-family: var(--font-display);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-faint);
  margin: 18px 0 8px;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto 132px 46px;
  align-items: center;
  gap: 14px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-left-width: 3px;
  border-radius: 10px;
  padding: 6px 14px 6px 11px;
  transition: border-color 0.12s, background 0.12s;
}
.row:hover {
  background: #161c28;
  border-color: #3a4654;
}
/* Liseré gauche coloré selon la note. */
.row.tier-5 {
  border-left-color: var(--good);
}
.row.tier-4 {
  border-left-color: var(--accent);
}
.row.tier-1 {
  border-left-color: var(--bad);
}
/* Lignes pseudo-cheerios : vignette + nom + note (pas de note /5). */
.prow {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-left: 3px solid var(--k-rock);
  border-radius: 10px;
  padding: 6px 14px 6px 11px;
  transition: border-color 0.12s, background 0.12s;
}
.prow:hover {
  background: #161c28;
  border-color: #3a4654;
}
.pinfo {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.pnote {
  font-size: 12px;
  color: var(--text-dim);
}
.thumb {
  width: 44px;
  height: auto;
  aspect-ratio: 488 / 680;
  object-fit: cover;
  border-radius: 4px;
  background: var(--bg-3);
  display: block;
}
.thumb.is-fallback {
  opacity: 0.9;
}
.name {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 650;
  color: var(--text);
  text-decoration: none;
  line-height: 1.25;
}
.name:hover {
  color: var(--accent);
}
.stars {
  display: flex;
  align-items: center;
  gap: 1px;
  font-size: 13px;
  line-height: 1;
}
.stars .on {
  color: var(--accent);
}
.stars .off {
  color: var(--bg-3);
}
.tag {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.score {
  justify-self: end;
  display: inline-flex;
  align-items: baseline;
  gap: 1px;
  font-family: var(--font-mono);
}
.score b {
  font-size: 15px;
  color: var(--accent);
}
.score .slash {
  font-size: 10px;
  color: var(--text-faint);
}
.note {
  font-size: 12px;
  line-height: 1.6;
  margin: 22px 0 0;
}
.note a {
  color: var(--accent);
}
/* Aperçu agrandi suivant le curseur. */
.hover-preview {
  position: fixed;
  z-index: 50;
  border-radius: 12px;
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.65);
  pointer-events: none;
  animation: preview-in 0.12s ease-out;
}
@keyframes preview-in {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
}
@media (hover: none) {
  .hover-preview {
    display: none;
  }
}
@media (max-width: 540px) {
  .row {
    grid-template-columns: 40px minmax(0, 1fr) auto 46px;
    gap: 10px;
  }
  .tag {
    display: none;
  }
}
</style>
