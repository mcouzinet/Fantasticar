import { kindCode } from './types'
import type { MulliganMode } from './types'
import type { Rng } from './prng'
import { shuffle } from './prng'
import type { Hand } from './hand'
import { landsInHand, zerosInHand } from './hand'

/**
 * Pioche les `count` premières cartes du deck mélangé dans une main (compte par kind).
 */
function dealInto(deckBuf: Int8Array, count: number, hand: Hand): void {
  hand.fill(0)
  for (let i = 0; i < count; i++) hand[deckBuf[i]!]!++
}

const Z = kindCode.zero
const LAND = kindCode.land
const LANDT = kindCode.landT
const VEIN = kindCode.vein
const CITY = kindCode.city

// Ordre d'enfouissement (London) : on enfouit les coûts élevés d'abord (§3.6).
const HIGH_COST_BURY = [
  kindCode.o7, kindCode.o6, kindCode.o5, kindCode.o4, kindCode.o3,
  kindCode.two, kindCode.creature,
]
// Dernier recours : pièces de combo bon marché, en gardant les zéros au maximum.
const LAST_RESORT_BURY = [
  kindCode.rock3, kindCode.rock2t, kindCode.rock2u,
  kindCode.chrom, kindCode.one,
]

/** Enfouit `n` cartes d'une main de 7 selon la règle §3.6 (garde au plus 3 terrains). */
function bottomCards(hand: Hand, n: number): void {
  // 1. Coûts élevés + créatures.
  for (const code of HIGH_COST_BURY) {
    while (n > 0 && hand[code]! > 0) { hand[code]!--; n-- }
  }
  // 2. Terrains au-delà de 3 (on enfouit landT puis land, on garde city/vein).
  if (n > 0) {
    let lands = landsInHand(hand)
    for (const code of [LANDT, LAND, VEIN]) {
      while (n > 0 && hand[code]! > 0 && lands > 3) { hand[code]!--; n--; lands-- }
    }
  }
  // 3. Dernier recours : pièces bon marché, puis zéros si vraiment forcé.
  if (n > 0) {
    for (const code of LAST_RESORT_BURY) {
      while (n > 0 && hand[code]! > 0) { hand[code]!--; n-- }
    }
  }
  if (n > 0) {
    while (n > 0 && hand[Z]! > 0) { hand[Z]!--; n-- }
  }
}

/** Critère de garde London selon la taille cible (§3.6). */
function keepLondon(hand: Hand, targetSize: number): boolean {
  const lands = landsInHand(hand)
  const zeros = zerosInHand(hand)
  if (targetSize >= 7) return lands >= 2 && lands <= 5 && zeros >= 2
  if (targetSize === 6) return lands >= 2 && zeros >= 1
  return lands >= 1 // targetSize 5
}

const MOXFIELD_CAP = 15

/**
 * Construit la main d'ouverture selon le mode (spec §3.6). Mute `outHand` et `deckBuf`
 * (mélange en place) ; renvoie le pointeur de bibliothèque (index de la prochaine pioche).
 *
 * Modélisation : les cartes enfouies vont au fond ; pour ≤ 5 tours on ne les repioche
 * jamais, donc la bibliothèque démarre à l'index 7 du dernier mélange.
 */
export function openingHand(
  deckBuf: Int8Array,
  rng: Rng,
  mode: MulliganMode,
  outHand: Hand,
): number {
  if (mode === 'none') {
    shuffle(deckBuf, rng)
    dealInto(deckBuf, 7, outHand)
    return 7
  }

  if (mode === 'moxfield') {
    // « New Hand » gratuit : re-tirage à 7 jusqu'à 2≤lands≤5 et zeros≥2 (cap ~15).
    for (let attempt = 0; attempt < MOXFIELD_CAP; attempt++) {
      shuffle(deckBuf, rng)
      dealInto(deckBuf, 7, outHand)
      const lands = landsInHand(outHand)
      if (lands >= 2 && lands <= 5 && zerosInHand(outHand) >= 2) break
    }
    return 7
  }

  // London : mulligan jusqu'à 5.
  for (let mull = 0; mull <= 2; mull++) {
    const targetSize = 7 - mull
    shuffle(deckBuf, rng)
    dealInto(deckBuf, 7, outHand)
    if (mull === 2 || keepLondon(outHand, targetSize)) {
      if (mull > 0) bottomCards(outHand, mull)
      return 7
    }
  }
  return 7
}
