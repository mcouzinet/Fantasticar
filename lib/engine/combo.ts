import type { Kind, SpellTable } from './types'
import { KINDS, kindCode } from './types'
import { FANTASTICAR_COST } from './spellTable'
import type { Hand } from './hand'
import { computeMana, type Battlefield, type LandDrop } from './mana'

/**
 * Contexte de combo précalculé à partir de la SpellTable : on sépare les sorts de
 * combo en "rembourseurs" (refund > 0) et "autres" (refund 0), chacun trié par coût
 * croissant. Cf. spec §3.4.
 */
export interface ComboContext {
  refunderKinds: number[] // codes, triés par coût croissant
  refunderCost: number[]
  refunderRefund: number[]
  otherKinds: number[] // codes (refund 0), triés par coût croissant
  otherCost: number[]
  fantasticarCost: number
}

export function buildComboContext(table: SpellTable): ComboContext {
  const refunders: { code: number; cost: number; refund: number }[] = []
  const others: { code: number; cost: number }[] = []
  for (const kind of KINDS as readonly Kind[]) {
    const p = table[kind]
    if (!p.isComboSpell) continue
    if (p.refund > 0) refunders.push({ code: kindCode[kind], cost: p.cost, refund: p.refund })
    else others.push({ code: kindCode[kind], cost: p.cost })
  }
  // Ordre de lancement optimal des rembourseurs (problème du capital minimal) : d'abord
  // ceux dont le remboursement couvre le coût (net ≤ 0, ex. Basalt Monolith net 0) triés
  // par coût croissant, puis les autres (net > 0) triés par remboursement décroissant.
  // (Le tri « par coût croissant » du §3.4 est sous-optimal dès qu'un rembourseur cher est
  //  net 0 : il doit être lancé tant que le solde est haut. Validé par le fuzz vs brute-force.)
  refunders.sort((a, b) => {
    const aCovers = a.refund >= a.cost
    const bCovers = b.refund >= b.cost
    if (aCovers !== bCovers) return aCovers ? -1 : 1
    return aCovers ? a.cost - b.cost : b.refund - a.refund
  })
  others.sort((a, b) => a.cost - b.cost)
  return {
    refunderKinds: refunders.map((r) => r.code),
    refunderCost: refunders.map((r) => r.cost),
    refunderRefund: refunders.map((r) => r.refund),
    otherKinds: others.map((o) => o.code),
    otherCost: others.map((o) => o.cost),
    fantasticarCost: FANTASTICAR_COST,
  }
}

/**
 * Faisabilité du combo pour un mana donné (sans énumération de pose de terrain).
 * Exposé pour les tests (fuzz vs brute-force).
 */
export function comboFeasibleForMana(
  ctx: ComboContext,
  hand: Hand,
  mana: number,
  fCast: boolean,
): boolean {
  let k = 0
  for (let i = 0; i < ctx.refunderKinds.length && k < MAX_REFUNDERS; i++) {
    let n = hand[ctx.refunderKinds[i]!]!
    const cost = ctx.refunderCost[i]!
    const refund = ctx.refunderRefund[i]!
    while (n-- > 0 && k < MAX_REFUNDERS) {
      refCost[k] = cost
      refRefund[k] = refund
      k++
    }
  }
  let m = 0
  for (let i = 0; i < ctx.otherKinds.length; i++) {
    let n = hand[ctx.otherKinds[i]!]!
    const cost = ctx.otherCost[i]!
    while (n-- > 0 && m < othCost.length) othCost[m++] = cost
  }
  return feasible(k, m, mana, fCast, ctx.fantasticarCost)
}

const MAX_REFUNDERS = 6 // cap §3.4 : borne l'énumération de sous-ensembles à 2^6

// Buffers réutilisés (pas d'allocation par appel).
const refCost = new Int32Array(MAX_REFUNDERS)
const refRefund = new Int32Array(MAX_REFUNDERS)
const othCost = new Int32Array(64)

/**
 * Le combo passe-t-il, pour AU MOINS un terrain posable ce tour ? (spec §3.4 + §3.7)
 *
 * On construit une fois les listes de rembourseurs/autres depuis la main, puis on teste
 * chaque pose de terrain candidate (y compris « ne rien poser ») : seul le `mana` change.
 */
export function bestCombo(
  ctx: ComboContext,
  hand: Hand,
  bf: Battlefield,
  fCast: boolean,
): boolean {
  // 1. Rembourseurs présents en main (cap 6), déjà triés par coût croissant.
  let k = 0
  for (let i = 0; i < ctx.refunderKinds.length && k < MAX_REFUNDERS; i++) {
    let n = hand[ctx.refunderKinds[i]!]!
    const cost = ctx.refunderCost[i]!
    const refund = ctx.refunderRefund[i]!
    while (n-- > 0 && k < MAX_REFUNDERS) {
      refCost[k] = cost
      refRefund[k] = refund
      k++
    }
  }

  // 2. Autres sorts de combo présents en main, triés par coût croissant.
  let m = 0
  for (let i = 0; i < ctx.otherKinds.length; i++) {
    let n = hand[ctx.otherKinds[i]!]!
    const cost = ctx.otherCost[i]!
    while (n-- > 0 && m < othCost.length) {
      othCost[m++] = cost
    }
  }

  // 3. Tester chaque pose de terrain candidate.
  if (feasible(k, m, computeMana(bf, 'none'), fCast, ctx.fantasticarCost)) return true
  if (hand[kindCode.land]! > 0 && feasible(k, m, computeMana(bf, 'land'), fCast, ctx.fantasticarCost)) return true
  if (hand[kindCode.landT]! > 0 && feasible(k, m, computeMana(bf, 'landT'), fCast, ctx.fantasticarCost)) return true
  if (hand[kindCode.vein]! > 0 && feasible(k, m, computeMana(bf, 'vein'), fCast, ctx.fantasticarCost)) return true
  if (hand[kindCode.city]! > 0 && feasible(k, m, computeMana(bf, 'city'), fCast, ctx.fantasticarCost)) return true
  return false
}

/**
 * Recherche exacte (§3.4) : pour un mana donné, existe-t-il un sous-ensemble de
 * rembourseurs + des autres sorts permettant d'atteindre `need` sorts de combo après
 * avoir payé le Fantasticar ?
 *
 * @param k nb de rembourseurs disponibles (refCost/refRefund remplis)
 * @param m nb d'autres sorts (othCost rempli, trié croissant)
 */
function feasible(k: number, m: number, mana: number, fCast: boolean, fanCost: number): boolean {
  const need = fCast ? 4 : 3 // sorts à lancer EN PLUS du Fantasticar déjà compté
  const fCost = fCast ? 0 : fanCost

  const subsets = 1 << k
  for (let mask = 0; mask < subsets; mask++) {
    let bal = mana
    let cnt = 0
    let valid = true
    for (let i = 0; i < k; i++) {
      if ((mask & (1 << i)) === 0) continue
      const cost = refCost[i]!
      if (bal < cost) {
        valid = false
        break
      }
      bal -= cost - refRefund[i]!
      cnt++
    }
    if (!valid || bal < fCost) continue
    bal -= fCost // on lance le Fantasticar
    for (let j = 0; j < m && cnt < need; j++) {
      const c = othCost[j]!
      if (bal >= c) {
        bal -= c
        cnt++
      }
    }
    if (cnt >= need) return true
  }
  return false
}
