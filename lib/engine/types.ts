// Modèle de données du moteur (cf. spec §5 et §3.1).
// Module 100 % framework-agnostic : aucune dépendance Vue/Nuxt ici.

/** Catégorie mécanique d'une carte. Une carte = une seule catégorie (spec §3.1). */
export type Kind =
  | 'land' | 'landT' | 'city' | 'vein'
  | 'land0' | 'landGrant' // Maze of Ith (0 mana) · donneur de type (Yavimaya/Urborg)
  | 'landScry' // terrain dégagé qui scry/surveil 1 à l'arrivée (filtre la prochaine pioche)
  | 'zero' | 'amulet' | 'rock2u' | 'rock2t' | 'rock3'
  | 'basalt' | 'mightstone' | 'sol' // cailloux à profil mana particulier
  | 'one' | 'chrom' | 'two'
  | 'o3' | 'o4' | 'o5' | 'o6' | 'o7'
  | 'creature'

/** Ordre canonique des kinds → code entier utilisé dans les buffers de perf. */
export const KINDS: readonly Kind[] = [
  'land', 'landT', 'city', 'vein',
  'land0', 'landGrant', 'landScry',
  'zero', 'amulet', 'rock2u', 'rock2t', 'rock3',
  'basalt', 'mightstone', 'sol',
  'one', 'chrom', 'two',
  'o3', 'o4', 'o5', 'o6', 'o7',
  'creature',
] as const

export const KIND_COUNT = KINDS.length

/** Code entier d'un kind (index dans KINDS). */
export const kindCode: Record<Kind, number> = Object.fromEntries(
  KINDS.map((k, i) => [k, i]),
) as Record<Kind, number>

export interface Card {
  name: string
  kind: Kind
  qty: number // 1 en Commander, mais on supporte qty>1 pour la généricité
}

export interface Deck {
  cards: Card[] // total visé = 99
}

/**
 * Paramètres mécaniques centralisés (= hypothèses §3.8, éditables sans toucher au moteur).
 * - cost   : coût en mana pour lancer le sort.
 * - refund : mana rendu LE TOUR MÊME où la carte est lancée pendant le combo
 *            (caillou tapé, Chromatic sacrifié…). Sert au comptage du combo (§3.4).
 * - isComboSpell : la carte compte-t-elle parmi les 4 sorts du combo ?
 * - producesMana : la carte est-elle une source de mana permanente (caillou) ?
 * - tappedRock   : si caillou, arrive-t-il engagé (produit au tour suivant seulement) ?
 */
export interface SpellProfile {
  cost: number
  refund: number
  isComboSpell: boolean
  producesMana: boolean
  tappedRock: boolean
  /** Mana produit par tour par le caillou une fois en jeu (défaut 1 si producesMana). */
  tapsFor?: number
  /**
   * Suspend N : si défini, la carte n'est pas lançable normalement. On paie `cost`
   * (coût de suspend) pour l'exiler avec N marqueurs temps ; elle est lancée
   * gratuitement N tours plus tard (entre alors comme permanent et, si combo, compte
   * comme un sort non-créature lancé ce tour-là). Cf. §"suspend" du moteur.
   */
  suspend?: number
}

export type SpellTable = Record<Kind, SpellProfile>

export type MulliganMode = 'none' | 'london' | 'moxfield'

export interface SimConfig {
  iterations: number // 5_000 | 15_000 | 40_000
  mulligan: MulliganMode
  maxTurn: number // 5
  seed: number
}

/** Probabilités CUMULÉES P(combo au plus tard à t). */
export interface TurnProbabilities {
  t2: number
  t3: number
  t4: number
  t5: number
}

export interface SimResult {
  onPlay: TurnProbabilities
  onDraw: TurnProbabilities
  iterations: number
  /** Demi-largeur d'IC en points (pour l'affichage ±). */
  ciHalfWidthPt: number
}

export interface Comparison {
  baseline: SimResult
  draft: SimResult
}
