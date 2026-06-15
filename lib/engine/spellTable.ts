import type { SpellTable } from './types'

/**
 * Profils mécaniques par kind (spec §3.1).
 *
 * Remboursement (`refund`) = mana rendu le tour même où la carte est lancée pendant
 * le combo. Coût net pendant le combo = cost - refund.
 *   - rock1 (Fractured Powerstone) : payé 1, tape pour 1  → net 0, refund 1
 *   - rock2u (caillou prêt)        : payé 2, tape pour 1  → net 1, refund 1
 *   - rock2t (caillou engagé)      : payé 2, arrive tapped → net 2, refund 0
 *   - rock3 (Solar Transformer)    : payé 3, tape pour 1  → net 2, refund 1
 *   - chrom (Chromatic Sphere/Star): payé 1, sacrifié → +1 → net 0, refund 1
 *
 * Ces valeurs sont les hypothèses §3.8 : centralisées et éditables sans toucher au moteur.
 */
export const DEFAULT_SPELL_TABLE: SpellTable = {
  // — Terrains (jamais des sorts de combo) —
  land: { cost: 0, refund: 0, isComboSpell: false, producesMana: false, tappedRock: false },
  landT: { cost: 0, refund: 0, isComboSpell: false, producesMana: false, tappedRock: false },
  city: { cost: 0, refund: 0, isComboSpell: false, producesMana: false, tappedRock: false },
  vein: { cost: 0, refund: 0, isComboSpell: false, producesMana: false, tappedRock: false },

  // — Sorts non-créature : sorts de combo —
  zero: { cost: 0, refund: 0, isComboSpell: true, producesMana: false, tappedRock: false },
  rock1: { cost: 1, refund: 1, isComboSpell: true, producesMana: true, tappedRock: false },
  rock2u: { cost: 2, refund: 1, isComboSpell: true, producesMana: true, tappedRock: false },
  rock2t: { cost: 2, refund: 0, isComboSpell: true, producesMana: true, tappedRock: true },
  rock3: { cost: 3, refund: 1, isComboSpell: true, producesMana: true, tappedRock: false },
  one: { cost: 1, refund: 0, isComboSpell: true, producesMana: false, tappedRock: false },
  chrom: { cost: 1, refund: 1, isComboSpell: true, producesMana: false, tappedRock: false },
  two: { cost: 2, refund: 0, isComboSpell: true, producesMana: false, tappedRock: false },
  o3: { cost: 3, refund: 0, isComboSpell: true, producesMana: false, tappedRock: false },
  o4: { cost: 4, refund: 0, isComboSpell: true, producesMana: false, tappedRock: false },
  o5: { cost: 5, refund: 0, isComboSpell: true, producesMana: false, tappedRock: false },
  o6: { cost: 6, refund: 0, isComboSpell: true, producesMana: false, tappedRock: false },
  o7: { cost: 7, refund: 0, isComboSpell: true, producesMana: false, tappedRock: false },

  // — Créatures (jamais des sorts de combo) —
  creature: { cost: 0, refund: 0, isComboSpell: false, producesMana: false, tappedRock: false },
}

/** Coût du Fantasticar (commander, lancé depuis la zone de commandement). */
export const FANTASTICAR_COST = 3
