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
  Wastes: 'land',
  "Adventurer's Inn": 'land',
  'Fomori Vault': 'land',

  // — Terrains spéciaux —
  'Maze of Ith': 'land0', // ne tape pour aucun mana
  'Yavimaya, Cradle of Growth': 'landGrant', // chaque terrain devient Forêt → active les Maze
  'Urborg, Tomb of Yawgmoth': 'landGrant', // chaque terrain devient Marais → active les Maze

  // — Terrains engagés (enters tapped) —
  Cloudpost: 'landT',
  'Guildless Commons': 'landT',
  'Ruins of Oran-Rief': 'landT',

  // — Terrain à mana légendaire (entre engagé, tape {C}{C} pour les sorts légendaires) —
  // Untaidake : paie le Fantasticar (seul sort légendaire du combo). Cf. mana.ts/combo.ts.
  'Untaidake, the Cloud Keeper': 'cloud',

  // — Cailloux coût 2 engagés —
  'Coldsteel Heart': 'rock2t',
  'Guardian Idol': 'rock2t',
  'Planar Atlas': 'rock2t',
  'Solar Transformer': 'rock2t',

  // — Caillou coût 3 —
  'Patchwork Banner': 'rock3',
  'Honor-Worn Shaku': 'rock3', // {3}, {T}: {C}

  // — Caillou coût 4 (tape pour 3) —
  'Thran Dynamo': 'dynamo',

  // — Sorts à 0 —
  'Chalice of the Void': 'zero', // {X}{X}, joué X=0
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
  'Vexing Bauble': 'chrom', // {1} ; activation pioche = {1},T,sac (sans mana) → sort à 1 net
  "Conjurer's Bauble": 'one', // {1} ; sac (sans coût) → pioche
  "Wayfarer's Bauble": 'one', // {1} ; rampe lente ({2},sac → terrain de base engagé)
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
  'Krark-Clan Ironworks': 'o4', // {4} ; moteur de mana (sac artefact → CC) sous-modélisé en o4
  'Apple of Eden, Isu Relic': 'o4',
  'Ugin, the Ineffable': 'o6',

  // — Créatures —
  // Metalworker : artefact-créature qui produit beaucoup de mana, mais créature (mal d'invocation,
  // conditionnel aux artefacts en main) → modélisé conservativement en créature (mana non simulé).
  Metalworker: 'creature',
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
