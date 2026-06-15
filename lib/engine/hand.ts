import { KIND_COUNT, kindCode } from './types'

/** Une main = compte par kind (l'ordre des cartes en main n'a pas d'importance ici). */
export type Hand = Int16Array

export function newHand(): Hand {
  return new Int16Array(KIND_COUNT)
}

const LAND_CODES = [kindCode.land, kindCode.landT, kindCode.city, kindCode.vein] as const

export function landsInHand(hand: Hand): number {
  return (
    hand[LAND_CODES[0]]! +
    hand[LAND_CODES[1]]! +
    hand[LAND_CODES[2]]! +
    hand[LAND_CODES[3]]!
  )
}

export function zerosInHand(hand: Hand): number {
  return hand[kindCode.zero]!
}
