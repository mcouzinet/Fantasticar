import type { SpellTable } from './types'

/**
 * Profils mécaniques par kind (spec §3.1).
 *
 * Remboursement (`refund`) = mana rendu le tour même où la carte est lancée pendant
 * le combo. Coût net pendant le combo = cost - refund.
 *   - rock2u (caillou prêt, ex. Fractured Powerstone) : payé 2, tape pour 1 → net 1, refund 1
 *   - rock2t (caillou engagé)      : payé 2, arrive tapped → net 2, refund 0
 *   - rock3 (Solar Transformer)    : payé 3, tape pour 1  → net 2, refund 1
 *   - chrom (Chromatic Sphere/Star, Relic of Progenitus) : payé 1 pour lancer ; l'activation
 *     qui pioche coûte {1} (Chromatic rend 1 mana → net 0 sur l'activation ; Relic n'en rend
 *     pas). Aucun gain de mana net pour enchaîner le combo → sort à 1 net, refund 0.
 *
 * Ces valeurs sont les hypothèses §3.8 : centralisées et éditables sans toucher au moteur.
 */
export const DEFAULT_SPELL_TABLE: SpellTable = {
  // — Terrains (jamais des sorts de combo) —
  land: { cost: 0, refund: 0, isComboSpell: false, producesMana: false, tappedRock: false },
  landT: { cost: 0, refund: 0, isComboSpell: false, producesMana: false, tappedRock: false },
  city: { cost: 0, refund: 0, isComboSpell: false, producesMana: false, tappedRock: false },
  vein: { cost: 0, refund: 0, isComboSpell: false, producesMana: false, tappedRock: false },
  // Maze of Ith : terrain qui ne tape pour aucun mana (mana géré dans mana.ts, pas ici).
  land0: { cost: 0, refund: 0, isComboSpell: false, producesMana: false, tappedRock: false },
  // Yavimaya/Urborg : terrain donneur de type (tape pour 1 + active les Maze, cf. mana.ts).
  landGrant: { cost: 0, refund: 0, isComboSpell: false, producesMana: false, tappedRock: false },
  // Terrain dégagé qui scry/surveil 1 à l'arrivée (filtre la prochaine pioche, cf. game.ts).
  landScry: { cost: 0, refund: 0, isComboSpell: false, producesMana: false, tappedRock: false },

  // — Sorts non-créature : sorts de combo —
  zero: { cost: 0, refund: 0, isComboSpell: true, producesMana: false, tappedRock: false },
  rock2u: { cost: 2, refund: 1, isComboSpell: true, producesMana: true, tappedRock: false, tapsFor: 1 },
  rock2t: { cost: 2, refund: 0, isComboSpell: true, producesMana: true, tappedRock: true, tapsFor: 1 },
  rock3: { cost: 3, refund: 1, isComboSpell: true, producesMana: true, tappedRock: false, tapsFor: 1 },
  // Cailloux à profil mana particulier (vérifiés sur Scryfall) :
  // Basalt Monolith : {3}, tape pour {C}{C}{C} mais ne se dégage pas → net 0 le tour lancé
  //   (refund 3), AUCUNE rampe pérenne (producesMana=false). Excellent activateur de combo.
  basalt: { cost: 3, refund: 3, isComboSpell: true, producesMana: false, tappedRock: false },
  // The Mightstone and Weakstone : {5}, tape pour {C}{C} → tapsFor 2, refund 2.
  mightstone: { cost: 5, refund: 2, isComboSpell: true, producesMana: true, tappedRock: false, tapsFor: 2 },
  // Sol Talisman : Suspend 3—{1} (paie {1}, 3 marqueurs temps → lancé à T+3, ~T4), tape pour
  //   {C}{C}. Déployé via le mécanisme suspend : à la résolution il entre (rampe +2) ET compte
  //   comme un sort non-créature lancé ce tour (impacte donc le combo T4, pas T3).
  sol: { cost: 1, refund: 0, isComboSpell: true, producesMana: true, tappedRock: false, tapsFor: 2, suspend: 3 },
  one: { cost: 1, refund: 0, isComboSpell: true, producesMana: false, tappedRock: false },
  chrom: { cost: 1, refund: 0, isComboSpell: true, producesMana: false, tappedRock: false },
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
