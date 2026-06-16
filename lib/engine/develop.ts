import type { Kind, SpellTable } from './types'
import { KINDS, kindCode } from './types'
import { FANTASTICAR_COST } from './spellTable'
import type { Hand } from './hand'
import { zerosInHand } from './hand'
import { applyDrop, computeMana, type Battlefield, type LandDrop } from './mana'

/** Cailloux et cartes suspend précalculés depuis la SpellTable. */
export interface DevelopContext {
  // cailloux normaux (produisent du mana en jeu), triés net puis coût croissants
  rockKinds: number[]
  rockCost: number[]
  rockNet: number[]
  rockTaps: number[] // mana produit par tour
  // cartes déployées via suspend
  suspendKinds: number[]
  suspendCost: number[]
  suspendN: number[]
  suspendTaps: number[]
  suspendCombo: boolean[]
}

export function buildDevelopContext(table: SpellTable): DevelopContext {
  const rocks: { code: number; cost: number; net: number; taps: number }[] = []
  const susp: { code: number; cost: number; n: number; taps: number; combo: boolean }[] = []
  for (const kind of KINDS as readonly Kind[]) {
    const p = table[kind]
    if (p.suspend) {
      susp.push({ code: kindCode[kind], cost: p.cost, n: p.suspend, taps: p.tapsFor ?? 0, combo: p.isComboSpell })
      continue
    }
    if (!p.producesMana) continue
    rocks.push({ code: kindCode[kind], cost: p.cost, net: p.cost - p.refund, taps: p.tapsFor ?? 1 })
  }
  rocks.sort((a, b) => a.net - b.net || a.cost - b.cost) // rock2u, rock2t, rock3, mightstone
  return {
    rockKinds: rocks.map((r) => r.code),
    rockCost: rocks.map((r) => r.cost),
    rockNet: rocks.map((r) => r.net),
    rockTaps: rocks.map((r) => r.taps),
    suspendKinds: susp.map((s) => s.code),
    suspendCost: susp.map((s) => s.cost),
    suspendN: susp.map((s) => s.n),
    suspendTaps: susp.map((s) => s.taps),
    suspendCombo: susp.map((s) => s.combo),
  }
}

const LAND = kindCode.land
const LANDT = kindCode.landT
const VEIN = kindCode.vein
const CITY = kindCode.city
const LAND0 = kindCode.land0
const LANDGRANT = kindCode.landGrant
const LANDSCRY = kindCode.landScry
const AMULET = kindCode.amulet

/** Choix de la pose de terrain (spec §3.5.1). */
function chooseDrop(hand: Hand, remaining: number): LandDrop {
  const hasLandT = hand[LANDT]! > 0
  // terrains dégagés produisant du mana, gardés en réserve (land/vein/city/landGrant/landScry)
  const immediate = hand[LAND]! + hand[VEIN]! + hand[CITY]! + hand[LANDGRANT]! + hand[LANDSCRY]!
  if (hasLandT && immediate >= remaining) return 'landT'
  if (hand[LANDSCRY]! > 0) return 'landScry' // priorité : pose "gratuite" qui filtre la pioche
  if (hand[LANDGRANT]! > 0) return 'landGrant' // tape pour 1 + active les Maze
  if (hand[LAND]! > 0) return 'land'
  if (hand[VEIN]! > 0) return 'vein'
  if (hand[CITY]! > 0) return 'city' // dégagée, tape pour 2 → avant un terrain engagé (0 mana ce tour)
  if (hand[LANDT]! > 0) return 'landT'
  if (hand[LAND0]! > 0) return 'land0' // Maze : dernier recours (0 mana sauf donneur)
  return 'none'
}

function removeDrop(hand: Hand, drop: LandDrop): void {
  switch (drop) {
    case 'land': hand[LAND]!--; break
    case 'landT': hand[LANDT]!--; break
    case 'vein': hand[VEIN]!--; break
    case 'city': hand[CITY]!--; break
    case 'land0': hand[LAND0]!--; break
    case 'landGrant': hand[LANDGRANT]!--; break
    case 'landScry': hand[LANDSCRY]!--; break
    case 'none': break
  }
}

// — Filtre scry/surveil 1 (cf. game.ts) —
// On garde une carte tant que sa catégorie manque encore pour assembler le combo ; sinon on
// la jette (bottom/cimetière) pour piocher la suivante et creuser la pièce manquante.
const MANA_OK = 3 // sources de mana visées : de quoi lancer le Fantasticar, puis on creuse les sorts
const SPELLS_OK = 3 // sorts non-créature à trouver en main : 3 + le Fantasticar (zone de commandement) = les 4

const ALWAYS_BIN = new Set<number>([kindCode.creature, LAND0, kindCode.o6, kindCode.o7])
const ROCKS = [
  kindCode.rock2u, kindCode.rock2t, kindCode.rock3,
  kindCode.basalt, kindCode.mightstone, kindCode.sol,
]
const MANA_LANDS = [LAND, LANDT, VEIN, CITY, LANDGRANT, LANDSCRY]
const CHEAP_SPELLS = [kindCode.zero, kindCode.one, kindCode.chrom, kindCode.two]

/**
 * Décision scry/surveil 1 sur la carte du dessus (kind), selon l'état de la main.
 * `true` = on la garde ; `false` = on s'en débarrasse (on piochera la suivante).
 */
export function scryKeep(hand: Hand, kind: number): boolean {
  if (ALWAYS_BIN.has(kind)) return false // jamais utile au combo précoce
  let mana = 0
  for (const k of MANA_LANDS) mana += hand[k]!
  for (const k of ROCKS) mana += hand[k]!
  let cheap = 0
  for (const k of CHEAP_SPELLS) cheap += hand[k]!
  // terrain : utile seulement tant qu'on manque de sources de mana
  if (MANA_LANDS.includes(kind)) return mana < MANA_OK
  // caillou : mana ET carburant de combo
  if (ROCKS.includes(kind)) return mana < MANA_OK || cheap < SPELLS_OK
  // sorts non-créature castables (bon marché + o3/o4/o5) : utiles tant qu'on n'a pas les 4
  return cheap < SPELLS_OK
}

/**
 * Développe (pré-cast) sur un tour SANS combo (spec §3.5). Mute `hand` et `bf`,
 * renvoie le nouvel état `fCast` (Fantasticar en jeu ?).
 *
 * @param remaining nb de tours restants APRÈS celui-ci (maxTurn - t)
 */
export function develop(
  ctx: DevelopContext,
  hand: Hand,
  bf: Battlefield,
  fCast: boolean,
  remaining: number,
): boolean {
  // 1. Pose de terrain (priorité).
  const drop = chooseDrop(hand, remaining)
  let pool = computeMana(bf, drop)
  removeDrop(hand, drop)
  applyDrop(bf, drop)

  // 2. Pré-cast du Fantasticar si on prépare le tour combo (≥ 3 zéros en réserve).
  if (!fCast && pool >= FANTASTICAR_COST && zerosInHand(hand) >= 3) {
    pool -= FANTASTICAR_COST
    fCast = true
  }

  // 3. Pré-cast des cailloux abordables, du moins cher (net) au plus cher.
  for (let i = 0; i < ctx.rockKinds.length; i++) {
    const code = ctx.rockKinds[i]!
    const cost = ctx.rockCost[i]!
    const net = ctx.rockNet[i]!
    const taps = ctx.rockTaps[i]!
    while (hand[code]! > 0 && pool >= cost) {
      hand[code]!--
      pool -= net
      bf.pendingRockMana += taps // produit à partir du tour suivant
    }
  }

  // 3a. Jeweled Amulet : banque le mana en rab (paie {1} maintenant → +1 mana au tour suivant).
  //     On ne charge QUE si on a déjà ≥ 3 autres sorts bon marché en main : sacrifier l'Amulet
  //     comme source de mana ne coûte alors aucune pièce de combo (need = 3), c'est tout bénéf.
  //     Sinon on le garde comme sort à 0 (4e pièce). Évite de plomber le T3.
  if (hand[AMULET]! > 0 && pool >= 1) {
    let cheap = 0
    for (const k of CHEAP_SPELLS) cheap += hand[k]!
    while (hand[AMULET]! > 0 && pool >= 1 && cheap >= 3) {
      hand[AMULET]!--
      pool -= 1
      bf.pendingBank += 1
    }
  }

  // 3b. Suspend : exiler les cartes qui se résoudront avant la fin (N ≤ tours restants).
  for (let i = 0; i < ctx.suspendKinds.length; i++) {
    const code = ctx.suspendKinds[i]!
    const cost = ctx.suspendCost[i]!
    const n = ctx.suspendN[i]!
    const taps = ctx.suspendTaps[i]!
    const combo = ctx.suspendCombo[i]!
    while (hand[code]! > 0 && pool >= cost && n <= remaining) {
      hand[code]!--
      pool -= cost
      bf.suspend.push({ turnsLeft: n, tapsFor: taps, combo })
    }
  }

  // 4. Re-tenter le pré-cast du Fantasticar avec le mana restant (advance le commander).
  if (!fCast && pool >= FANTASTICAR_COST) {
    pool -= FANTASTICAR_COST
    fCast = true
  }

  return fCast
}
