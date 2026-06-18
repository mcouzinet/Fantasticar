import type { Kind, SpellTable } from './types'
import { KINDS, kindCode } from './types'
import { FANTASTICAR_COST } from './spellTable'
import type { Hand } from './hand'
import { computeMana, scorchedSacPool, type Battlefield, type LandDrop } from './mana'

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
    // On exclut les sorts suspend : ils ne sont pas lançables depuis la main ; leur
    // contribution au combo passe par la résolution de suspend (bf.freeCasts).
    if (!p.isComboSpell || p.suspend) continue
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
 *
 * `clouds` = nb d'Untaidake DÉGAGÉS disponibles. Chacun tape {C}{C} réservé aux sorts légendaires :
 * ils couvrent 2·clouds du coût du Fantasticar (le seul légendaire) et n'ajoutent AUCUN mana
 * générique. `mana` est le pool générique (sans eux). Géré dans `feasible`.
 */
export function comboFeasibleForMana(
  ctx: ComboContext,
  hand: Hand,
  mana: number,
  fCast: boolean,
  free = 0,
  clouds = 0,
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
  return feasible(k, m, mana, fCast, ctx.fantasticarCost, free, clouds)
}

const MAX_REFUNDERS = 6 // cap §3.4 : borne l'énumération de sous-ensembles à 2^6
const LEG_PER_CLOUD = 2 // Untaidake : {C}{C} légendaires par terrain dégagé (Fantasticar uniquement)

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

  // 3. Tester chaque pose de terrain candidate (free = sorts gratuits sortis de suspend ce tour).
  const free = bf.freeCasts
  const f = ctx.fantasticarCost
  const c = bf.cloud // Untaidake dégagés : {C}{C} légendaires chacun pour le Fantasticar (cf. feasible)
  // combo = true : c'est le tour du combo → Crystal Vein peut être sacrifiée pour {C}{C} (+1).
  // computeMana ne compte PAS les Untaidake (mana légendaire only) : `feasible` les applique au
  // Fantasticar via `clouds`.
  const cm = (drop: LandDrop): number => computeMana(bf, drop, true)
  if (feasible(k, m, cm('none'), fCast, f, free, c)) return true
  if (hand[kindCode.land]! > 0 && feasible(k, m, cm('land'), fCast, f, free, c)) return true
  if (hand[kindCode.landGrant]! > 0 && feasible(k, m, cm('landGrant'), fCast, f, free, c)) return true
  if (hand[kindCode.landScry]! > 0 && feasible(k, m, cm('landScry'), fCast, f, free, c)) return true
  if (hand[kindCode.landT]! > 0 && feasible(k, m, cm('landT'), fCast, f, free, c)) return true
  if (hand[kindCode.vein]! > 0 && feasible(k, m, cm('vein'), fCast, f, free, c)) return true
  if (hand[kindCode.city]! > 0 && feasible(k, m, cm('city'), fCast, f, free, c)) return true
  if (hand[kindCode.land0]! > 0 && feasible(k, m, cm('land0'), fCast, f, free, c)) return true
  if (hand[kindCode.scorched]! > 0 && scorchedSacPool(bf) >= 2 && feasible(k, m, cm('scorched'), fCast, f, free, c)) return true
  if (hand[kindCode.urzaMine]! > 0 && feasible(k, m, cm('urzaMine'), fCast, f, free, c)) return true
  if (hand[kindCode.urzaPP]! > 0 && feasible(k, m, cm('urzaPP'), fCast, f, free, c)) return true
  if (hand[kindCode.urzaTower]! > 0 && feasible(k, m, cm('urzaTower'), fCast, f, free, c)) return true
  if (hand[kindCode.planarNexus]! > 0 && feasible(k, m, cm('planarNexus'), fCast, f, free, c)) return true
  if (hand[kindCode.cloud]! > 0 && feasible(k, m, cm('cloud'), fCast, f, free, c)) return true
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
function feasible(k: number, m: number, mana: number, fCast: boolean, fanCost: number, free: number, clouds = 0): boolean {
  // Untaidake : chacun tape {C}{C} réservé aux sorts légendaires → couvre 2 du coût du Fantasticar
  // (le seul sort légendaire), sans toucher au pool générique (mana). L'excédent est perdu.
  const fCost = fCast ? 0 : Math.max(0, fanCost - LEG_PER_CLOUD * clouds)
  // `free` sorts non-créature ont déjà été lancés gratuitement ce tour (sorties de suspend).
  const need = (fCast ? 4 : 3) - free // sorts restants à lancer depuis la main
  if (need <= 0) return mana >= fCost // les sorts gratuits (+ Fantasticar) suffisent

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
    bal -= fCost // reste du Fantasticar payé en générique (les Untaidake en couvrent 2·clouds)
    for (let s = 0; s < m && cnt < need; s++) {
      const c = othCost[s]!
      if (bal >= c) {
        bal -= c
        cnt++
      }
    }
    if (cnt >= need) return true
  }
  return false
}

// — Variante « traçante » (pour l'affichage des recettes T2) : renvoie la ligne choisie —

export interface ComboLine {
  drop: LandDrop // terrain posé ce tour pour le combo ('none' si inutile)
  spellKinds: number[] // kinds des sorts non-créature lancés depuis la main (hors Fantasticar)
}

const DROP_CANDIDATES: LandDrop[] = [
  'none', 'land', 'landGrant', 'landScry', 'landT', 'vein', 'city', 'land0', 'scorched',
  'urzaMine', 'urzaPP', 'urzaTower', 'planarNexus', 'cloud',
]
const DROP_KIND: Partial<Record<LandDrop, number>> = {
  land: kindCode.land, landGrant: kindCode.landGrant, landScry: kindCode.landScry,
  landT: kindCode.landT, vein: kindCode.vein, city: kindCode.city, land0: kindCode.land0,
  scorched: kindCode.scorched,
  urzaMine: kindCode.urzaMine, urzaPP: kindCode.urzaPP, urzaTower: kindCode.urzaTower, planarNexus: kindCode.planarNexus,
  cloud: kindCode.cloud,
}

/**
 * Comme `bestCombo`, mais renvoie la PREMIÈRE ligne faisable (pose de terrain + sorts lancés),
 * ou `null`. Sert uniquement à reconstituer les recettes (lent, hors chemin de simulation).
 */
export function traceCombo(ctx: ComboContext, hand: Hand, bf: Battlefield, fCast: boolean): ComboLine | null {
  const refKind: number[] = [], refCost2: number[] = [], refRefund2: number[] = []
  for (let i = 0; i < ctx.refunderKinds.length && refKind.length < MAX_REFUNDERS; i++) {
    let n = hand[ctx.refunderKinds[i]!]!
    while (n-- > 0 && refKind.length < MAX_REFUNDERS) {
      refKind.push(ctx.refunderKinds[i]!); refCost2.push(ctx.refunderCost[i]!); refRefund2.push(ctx.refunderRefund[i]!)
    }
  }
  const othKind: number[] = [], othCost2: number[] = []
  for (let i = 0; i < ctx.otherKinds.length; i++) {
    let n = hand[ctx.otherKinds[i]!]!
    while (n-- > 0) { othKind.push(ctx.otherKinds[i]!); othCost2.push(ctx.otherCost[i]!) }
  }

  const free = bf.freeCasts
  // Untaidake dégagés : {C}{C} légendaires chacun → couvrent 2·clouds du coût du Fantasticar.
  const fanCost = fCast ? 0 : Math.max(0, ctx.fantasticarCost - LEG_PER_CLOUD * bf.cloud)
  const need = (fCast ? 4 : 3) - free
  const fCost = fanCost

  for (const drop of DROP_CANDIDATES) {
    if (drop !== 'none' && hand[DROP_KIND[drop]!]! <= 0) continue
    if (drop === 'scorched' && scorchedSacPool(bf) < 2) continue // besoin de 2 terrains dégagés à sacrifier
    const mana = computeMana(bf, drop, true) // tour du combo : Crystal Vein peut se sacrifier (+1)
    if (need <= 0) {
      if (mana >= fCost) return { drop, spellKinds: [] }
      continue
    }
    const k = refKind.length
    for (let mask = 0; mask < (1 << k); mask++) {
      let bal = mana, cnt = 0, valid = true
      const used: number[] = []
      for (let i = 0; i < k; i++) {
        if ((mask & (1 << i)) === 0) continue
        if (bal < refCost2[i]!) { valid = false; break }
        bal -= refCost2[i]! - refRefund2[i]!; cnt++; used.push(refKind[i]!)
      }
      if (!valid || bal < fCost) continue
      bal -= fCost
      for (let s = 0; s < othKind.length && cnt < need; s++) {
        if (bal >= othCost2[s]!) { bal -= othCost2[s]!; cnt++; used.push(othKind[s]!) }
      }
      if (cnt >= need) return { drop, spellKinds: used }
    }
  }
  return null
}
