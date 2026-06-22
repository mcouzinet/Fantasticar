import type { Card, Deck, Kind } from './types'

/**
 * Decklist de référence (99 cartes ; le commander The Fantasticar est hors des 99).
 *
 * Catégorisation vérifiée sur Scryfall (coût/type/production de mana). Sous-totaux :
 *   terrains 39 · sorts à 0 : 33 · cailloux 8 · sorts à 1 : 10 · sorts à 2 : 4 ·
 *   créatures 1 · autres 4  = 99.
 *
 * Hypothèses notables (conservatrices, cf. méthodo §3.8) :
 *  - Arid Archway / Echoing Deeps modélisés en landT simple (entrent engagés).
 *  - Scorched Ruins modélisé fidèlement (kind `scorched` : sacrifie 2 terrains dégagés, tape pour 4).
 *  - X = 0 (Astral Cornucopia, Everflowing Chalice, Chimeric Mass, Orochi Hatchery,
 *    Engineered Explosives, Sigil, Briber's Purse, Clown Car…).
 *  - Scale / Tooth of Chiss-Goria : affinité aux artefacts → ~gratuits → sorts à 0.
 *  - Tron Urza (Mine/PP/Tower) + Planar Nexus (toutes les pièces). Untaidake : mana {C}{C}
 *    légendaire (paie le Fantasticar). Gemstone Caverns : démarre en jeu sur la draw (kind `gemstone`).
 *  - Basalt Monolith : voir spellTable.ts (cast {3} → tape {C}{C}{C}, net 0).
 */
const NAMES_BY_KIND: Record<Kind, string[]> = {
  // — TERRAINS (39) —
  land: [
    'Abstergo Entertainment', 'Blast Zone', 'Castle Doom', 'Command Beacon',
    'Deserted Temple', 'Dust Bowl', 'Fomori Vault', "Inventors' Fair",
    'Petrified Hamlet', 'Radiant Fountain', 'Rishadan Port', 'Talon Gates of Madara',
    'Tectonic Edge', 'The Gold Saucer', "Thespian's Stage", "Urza's Cave",
    "Urza's Saga", "Urza's Workshop", 'War Room', 'Wastes',
  ],
  landT: ['Arid Archway', 'Echoing Deeps'], // entrent engagés
  city: ['City of Traitors'], // 2 mana récurrents (sacrifiée si on pose un autre terrain)
  vein: ['Crystal Vein'], // 1 mana/tour, ou sacrifice pour 2 (burst one-shot, cf. mana.ts)
  scorched: ['Scorched Ruins'], // sacrifie 2 terrains dégagés à l'arrivée, tape pour 4
  // Tron (set complet : Mine/PP tapent 2, Tower 3) ; Planar Nexus = toutes les pièces (tape 1).
  urzaMine: ["Urza's Mine"],
  urzaPP: ["Urza's Power Plant"],
  urzaTower: ["Urza's Tower"],
  planarNexus: ['Planar Nexus'],
  cloud: ['Untaidake, the Cloud Keeper'], // tape {C}{C} légendaire → paie le Fantasticar
  gemstone: ['Gemstone Caverns'], // terrain normal, mais démarre en jeu sur la draw (gagne un tour)
  land0: [], // terrain sans mana (Maze of Ith) — aucun dans cette liste
  landGrant: [], // donneur de type (Yavimaya/Urborg) — aucun dans cette liste
  // terrains dégagés qui scry/surveil 1 à l'arrivée (filtrent la prochaine pioche)
  landScry: [
    'Conduit Pylons', 'Crystal Grotto', 'Gallifrey Council Chamber', 'Hidden Grotto',
    'Rumble Arena', 'Surveillance Room', 'The Grey Havens', 'Zhalfirin Void',
  ],

  // — SORTS À 0 (33) —
  zero: [
    "Accorder's Shield", 'Astral Cornucopia', 'Bone Saw', "Briber's Purse",
    "Cathar's Shield", 'Chalice of the Void', 'Chimeric Mass', 'Claws of Gix',
    'Clown Car', 'Dark Sphere', 'Darksteel Relic', "Delif's Cone",
    'Engineered Explosives', 'Everflowing Chalice', 'Fountain of Youth', "Gustha's Scepter",
    'Herbal Poultice', 'Kite Shield',
    'Mox Jasper', 'Orochi Hatchery', 'Paradise Mantle', 'Scale of Chiss-Goria',
    'Sigil of Distinction', 'Spellbook', 'Spidersilk Net', 'Tooth of Chiss-Goria',
    "Tormod's Crypt", 'Welding Jar', 'Zuran Orb',
  ],
  amulet: ['Jeweled Amulet'], // sort à 0 qui banque 1 mana (activateur de combo précoce)
  bauble: ['Lodestone Bauble', "Mishra's Bauble", "Urza's Bauble"], // sort à 0 qui pioche (cantrip)

  // — CAILLOUX (8) —
  rock2u: [
    'Fellwar Stone', 'Fractured Powerstone', 'Liquimetal Torque', 'Mind Stone',
    'Prismatic Lens', 'The Irencrag', 'Thought Vessel',
  ],
  rock2t: [], // caillou coût 2 engagé — aucun dans cette liste
  rock3: [], // caillou coût 3 (type Solar Transformer) — aucun dans cette liste
  basalt: ['Basalt Monolith'], // cast {3} → tape {C}{C}{C} (net 0)
  mightstone: [], // aucun dans cette liste
  dynamo: [], // Thran Dynamo (candidat, catalogue) — aucun dans la liste de référence
  sol: [], // Sol Talisman — aucun dans cette liste

  // — SORTS À 1 (10) —
  one: [
    'Bear Trap', 'Campfire', "Conjurer's Bauble", 'Currency Converter', 'Expedition Map',
    'Pithing Needle', 'Retrofitter Foundry', 'Soul-Guide Lantern', 'World Map',
  ],
  chrom: ['Relic of Progenitus'], // {1} ; activation pioche {1},T,sac (sans mana) → sort à 1 net

  // — SORTS À 2 non-créature (4) —
  two: ['Defense Grid', "Kozilek's Command", 'Spatial Contortion', 'Warping Wail'],

  // — CRÉATURES (1) —
  creature: ['Glaring Fleshraker'],

  // — AUTRES non-créature (4) —
  o3: ['Tangle Wire', 'Tezzeret, Cruel Captain'],
  o4: ['Eldrazi Confluence', 'Mystic Forge'], // Eldrazi Confluence = {2}{C}{C} = 4
  o5: [],
  o6: [],
  o7: [],
}

export function buildReferenceDeck(): Deck {
  const cards: Card[] = []
  for (const kind of Object.keys(NAMES_BY_KIND) as Kind[]) {
    for (const name of NAMES_BY_KIND[kind]) {
      cards.push({ name, kind, qty: 1 })
    }
  }
  return { cards }
}

export const REFERENCE_DECK: Deck = buildReferenceDeck()
