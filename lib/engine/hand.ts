import { KIND_COUNT, kindCode } from './types'

/** Une main = compte par kind (l'ordre des cartes en main n'a pas d'importance ici). */
export type Hand = Int16Array

export function newHand(): Hand {
  return new Int16Array(KIND_COUNT)
}

// Terrains produisant du mana (pour le compte de terrains du mulligan §3.6).
// Tous les terrains qui tapent pour ≥ 1 comptent. land0 (Maze of Ith) est EXCLU : il ne
// produit pas de mana, ce n'est pas un terrain « utile » pour décider de garder une main.
const LAND_CODES = [
  kindCode.land, kindCode.landT, kindCode.city, kindCode.vein,
  kindCode.landGrant, kindCode.landScry, kindCode.scorched,
  kindCode.urzaMine, kindCode.urzaPP, kindCode.urzaTower, kindCode.planarNexus,
] as const

export function landsInHand(hand: Hand): number {
  let n = 0
  for (const c of LAND_CODES) n += hand[c]!
  return n
}

export function zerosInHand(hand: Hand): number {
  return hand[kindCode.zero]!
}
