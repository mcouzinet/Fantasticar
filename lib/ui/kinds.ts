import type { Kind } from '../engine/types'

/** Métadonnées d'affichage par kind : libellé court + couleur du badge. */
export interface KindMeta {
  label: string // libellé court pour le badge
  full: string // libellé long (sélecteur)
  color: string // variable CSS de couleur
}

export const KIND_META: Record<Kind, KindMeta> = {
  land: { label: 'Terrain', full: 'Terrain (prêt)', color: 'var(--k-land)' },
  landT: { label: 'Terrain ⟲', full: 'Terrain engagé', color: 'var(--k-land)' },
  city: { label: 'City', full: 'City of Traitors (2 mana récurrents)', color: 'var(--k-land)' },
  vein: { label: 'Vein', full: 'Crystal Vein (1/tour, ou sacrifice pour 2 au combo)', color: 'var(--k-land)' },
  land0: { label: 'Terrain 0', full: 'Terrain sans mana (Maze of Ith)', color: 'var(--k-land)' },
  landGrant: { label: 'Terrain type', full: 'Donneur de type (Yavimaya/Urborg)', color: 'var(--k-land)' },
  landScry: { label: 'Terrain 👁', full: 'Terrain à scry/surveil (filtre la pioche)', color: 'var(--k-land)' },
  scorched: { label: 'Terrain ×4', full: 'Scorched Ruins (sacrifie 2 terrains → tape pour 4)', color: 'var(--k-land)' },
  urzaMine: { label: 'Tron Mine', full: "Urza's Mine (tape 2 si set complet)", color: 'var(--k-land)' },
  urzaPP: { label: 'Tron PP', full: "Urza's Power Plant (tape 2 si set complet)", color: 'var(--k-land)' },
  urzaTower: { label: 'Tron Tower', full: "Urza's Tower (tape 3 si set complet)", color: 'var(--k-land)' },
  planarNexus: { label: 'Tron tous', full: 'Planar Nexus (compte comme toutes les pièces Tron)', color: 'var(--k-land)' },
  cloud: { label: 'Untaidake', full: 'Untaidake (engagé, {C}{C} pour le Fantasticar)', color: 'var(--k-land)' },
  gemstone: { label: 'Gemstone', full: 'Gemstone Caverns (démarre en jeu sur la draw)', color: 'var(--k-land)' },
  cloudpost: { label: 'Cloudpost', full: 'Cloudpost (engagé, tape {C} par Locus en jeu)', color: 'var(--k-land)' },
  locus: { label: 'Locus', full: 'Glimmerpost / Trenchpost (tape 1, compte comme Locus)', color: 'var(--k-land)' },
  zero: { label: '0', full: 'Sort non-créature — coût 0', color: 'var(--k-zero)' },
  amulet: { label: '0 banque', full: 'Jeweled Amulet (sort à 0, banque 1 mana)', color: 'var(--k-zero)' },
  bauble: { label: '0 pioche', full: 'Bauble (sort à 0 qui pioche : Mishra\'s/Urza\'s/Lodestone)', color: 'var(--k-zero)' },
  rock2u: { label: 'Caillou 2', full: 'Caillou — coût 2, prêt', color: 'var(--k-rock)' },
  rock2t: { label: 'Caillou 2⟲', full: 'Caillou — coût 2, engagé', color: 'var(--k-rock)' },
  rock3: { label: 'Caillou 3', full: 'Caillou — coût 3', color: 'var(--k-rock)' },
  basalt: { label: 'Monolith', full: 'Basalt Monolith (3 → 3, net 0)', color: 'var(--k-rock)' },
  mightstone: { label: 'Caillou 5', full: 'Mightstone & Weakstone (5 → 2)', color: 'var(--k-rock)' },
  dynamo: { label: 'Caillou 4', full: 'Thran Dynamo (4 → tape pour 3)', color: 'var(--k-rock)' },
  sol: { label: 'Suspend', full: 'Sol Talisman (Suspend 3 → caillou 2)', color: 'var(--k-rock)' },
  one: { label: '1', full: 'Sort non-créature — coût 1', color: 'var(--k-one)' },
  chrom: { label: 'Chrom', full: 'Cantrip à 1 (Chromatic, Relic — 1 pour piocher)', color: 'var(--k-one)' },
  two: { label: '2', full: 'Sort non-créature — coût 2', color: 'var(--k-two)' },
  o3: { label: '3', full: 'Sort non-créature — coût 3', color: 'var(--k-other)' },
  o4: { label: '4', full: 'Sort non-créature — coût 4', color: 'var(--k-other)' },
  o5: { label: '5', full: 'Sort non-créature — coût 5', color: 'var(--k-other)' },
  o6: { label: '6', full: 'Sort non-créature — coût 6', color: 'var(--k-other)' },
  o7: { label: '7', full: 'Sort non-créature — coût 7', color: 'var(--k-other)' },
  creature: { label: 'Créature', full: 'Créature', color: 'var(--k-creature)' },
}

/** Liste ordonnée des kinds pour les sélecteurs. */
export const KIND_OPTIONS: { value: Kind; label: string }[] = (
  Object.keys(KIND_META) as Kind[]
).map((k) => ({ value: k, label: `${KIND_META[k].label} — ${KIND_META[k].full}` }))
