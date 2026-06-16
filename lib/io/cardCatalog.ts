import type { Kind } from '../engine/types'

/**
 * Catalogue nom → kind pour un pool de cartes plus large que la decklist de référence,
 * catégorisé d'après les données Scryfall (coût, type, production de mana). Sert à
 * reconnaître ces cartes à l'import (sinon elles tombent dans « à catégoriser »).
 *
 * Notes de modélisation (conservatrices) :
 *  - Solar Transformer = {2} qui entre engagé → rock2t (et non « caillou à 3 »).
 *  - Null Elemental Blast = coût {C} (1), pas 2.
 *  - Eldrazi Temple : le {C}{C} est réservé aux Eldrazi → modélisé à 1 (conservateur).
 *  - Mox Jasper : mana seulement si l'on contrôle un Dragon → pas de mana fiable → zero.
 *  - Scale / Tooth of Chiss-Goria : affinité aux artefacts → ~gratuits en deck artefacts → zero.
 *  - Lands Locus (Cloudpost/Glimmerpost/Trenchpost) modélisés à 1 (pas de bonus Locus).
 */
export const CARD_CATALOG: Record<string, Kind> = {
  // — Terrains prêts (tapent {C}, entrent dégagés) —
  'Blinkmoth Nexus': 'land',
  'Buried Ruin': 'land',
  'Deserted Temple': 'land',
  'Eldrazi Temple': 'land',
  Glimmerpost: 'land',
  'Horizon of Progress': 'land',
  'Hostile Desert': 'land',
  'Lazotep Quarry': 'land',
  Mirrex: 'land',
  'Radiant Fountain': 'land',
  'Scavenger Grounds': 'land',
  'The Gold Saucer': 'land',
  'Treasure Vault': 'land',
  Trenchpost: 'land',

  // — Terrains engagés (enters tapped) —
  Cloudpost: 'landT',
  'Guildless Commons': 'landT',
  'Ruins of Oran-Rief': 'landT',
  'Untaidake, the Cloud Keeper': 'landT',

  // — Cailloux coût 2 engagés —
  'Coldsteel Heart': 'rock2t',
  'Guardian Idol': 'rock2t',
  'Planar Atlas': 'rock2t',
  'Solar Transformer': 'rock2t',

  // — Caillou coût 3 —
  'Patchwork Banner': 'rock3',

  // — Sorts à 0 —
  "Accorder's Shield": 'zero',
  "Cathar's Shield": 'zero',
  'Darksteel Relic': 'zero',
  "Gustha's Scepter": 'zero',
  'Herbal Poultice': 'zero',
  'Kite Shield': 'zero',
  'Mox Jasper': 'zero',
  Spellbook: 'zero',
  'Scale of Chiss-Goria': 'zero',
  'Tooth of Chiss-Goria': 'zero',

  // — Sorts à 1 —
  'Relic of Progenitus': 'chrom', // {1} ; activation pioche = {1},T,sac (sans mana) → sort à 1 net
  'Candy Trail': 'one',
  'Currency Converter': 'one',
  'Eldritch Immunity': 'one',
  'Goblin Firebomb': 'one',
  'Null Elemental Blast': 'one',
  Skateboard: 'one',

  // — Sorts à 2 —
  'Levitating Statue': 'two',
  'The Ooze': 'two',

  // — Autres (sorts non-créature chers) —
  'Tangle Wire': 'o3',
  'Apple of Eden, Isu Relic': 'o4',
  'Ugin, the Ineffable': 'o6',

  // — Créatures —
  'Arcbound Ravager': 'creature',
  'Compass Gnome': 'creature',
  'It That Heralds the End': 'creature',
  "Liberator, Urza's Battlethopter": 'creature',
  'Metallic Mimic': 'creature',
  'Scampering Surveyor': 'creature',
  'Skittering Cicada': 'creature',
  'Steel Overseer': 'creature',
  'Thought-Knot Seer': 'creature',
}
