import { KIND_COUNT, kindCode } from './types'

/** Une main = compte par kind (l'ordre des cartes en main n'a pas d'importance ici). */
export type Hand = Int16Array

export function newHand(): Hand {
  return new Int16Array(KIND_COUNT)
}

// Terrains produisant du mana (pour le compte de terrains du mulligan §3.6).
// landGrant (Yavimaya/Urborg) et landScry tapent pour 1 → comptent comme terrains.
// land0 (Maze of Ith) est EXCLU : il ne produit pas de mana, ce n'est pas un terrain « utile ».
const LAND_CODES = [
  kindCode.land, kindCode.landT, kindCode.city, kindCode.vein,
  kindCode.landGrant, kindCode.landScry,
] as const

export function landsInHand(hand: Hand): number {
  let n = 0
  for (const c of LAND_CODES) n += hand[c]!
  return n
}

export function zerosInHand(hand: Hand): number {
  return hand[kindCode.zero]!
}
