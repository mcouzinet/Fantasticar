import type { Card, Deck, Kind } from './types'

/**
 * Decklist de référence (99 cartes ; le commander The Fantasticar est hors des 99).
 *
 * Catégorisation vérifiée sur Scryfall (coût/type/production de mana). Sous-totaux :
 *   terrains 39 · sorts à 0 : 25 · cailloux 10 · sorts à 1 : 10 · sorts à 2 : 5 ·
 *   créatures 3 · autres 7  = 99.
 *
 * Hypothèses notables (conservatrices, cf. méthodo §3.8) :
 *  - Arid Archway modélisé en landT simple.
 *  - Scorched Ruins modélisé fidèlement (kind `scorched` : sacrifie 2 terrains dégagés, tape pour 4).
 *  - X = 0 (Astral Cornucopia, Everflowing Chalice, Chimeric Mass, Orochi Hatchery,
 *    Engineered Explosives, Sigil, Briber's Purse, Kozilek's Command…).
 *  - Forsaken Monument modélisé en sort à 5 « nu » : son doublement de mana est ignoré.
 *  - Tron non assemblé ; Gemstone Caverns = land standard.
 *  - Cailloux spéciaux (Basalt Monolith, Mightstone & Weakstone, Sol Talisman) : voir
 *    spellTable.ts pour le détail de leur modélisation.
 */
const NAMES_BY_KIND: Record<Kind, string[]> = {
  // — TERRAINS (39) —
  land: [
    'Abstergo Entertainment', 'Blast Zone', 'Castle Doom', 'Command Beacon',
    'Darksteel Citadel', 'Dust Bowl',
    'Fountainport', 'Gemstone Caverns',
    "Inventors' Fair", "Mishra's Factory", "Mishra's Foundry", 'Mutavault',
    'Petrified Hamlet', 'Planar Nexus', 'Rishadan Port',
    'Snow-Covered Wastes', 'Talon Gates of Madara',
    "Thespian's Stage", "Urza's Cave", "Urza's Mine",
    "Urza's Power Plant", "Urza's Saga", "Urza's Tower", "Urza's Workshop",
    'War Room',
  ],
  landT: ['Arid Archway', 'Echoing Deeps', 'Vesuva'], // entrent engagés
  // Sources de 2 mana à usage unique (tap puis sacrifice/consommation). Crystal Vein
  // (tape 1 ou sacrifie pour 2) est modélisé comme City : 2 mana one-shot, pas +2 récurrent.
  city: ['City of Traitors', 'Crystal Vein'],
  vein: [], // kind conservé mais inutilisé (Crystal Vein → city)
  scorched: ['Scorched Ruins'], // sacrifie 2 terrains dégagés à l'arrivée, tape pour 4
  land0: [], // terrain sans mana (Maze of Ith) — aucun dans cette liste
  landGrant: [], // donneur de type (Yavimaya/Urborg) — aucun dans cette liste
  // terrains dégagés qui scry/surveil 1 à l'arrivée (filtrent la prochaine pioche)
  landScry: [
    'Conduit Pylons', 'Crystal Grotto', 'Gallifrey Council Chamber', 'Hidden Grotto',
    'Rumble Arena', 'Surveillance Room', 'The Grey Havens', 'Zhalfirin Void',
  ],

  // — SORTS À 0 (25) —
  zero: [
    'Astral Cornucopia', 'Bone Saw', "Briber's Purse", 'Chimeric Mass', 'Claws of Gix',
    'Clown Car', 'Dark Sphere', "Delif's Cone", 'Engineered Explosives',
    'Everflowing Chalice', 'Fountain of Youth', 'Lodestone Bauble',
    "Mishra's Bauble", 'Orochi Hatchery', 'Paradise Mantle', 'Sigil of Distinction',
    'Spidersilk Net', "Tormod's Crypt", "Urza's Bauble", 'Welding Jar', 'Zuran Orb',
    "Accorder's Shield", "Cathar's Shield", 'Kite Shield',
  ],
  amulet: ['Jeweled Amulet'], // sort à 0 qui banque 1 mana (activateur de combo précoce)

  // — CAILLOUX (10) —
  rock2u: [
    'Fellwar Stone', 'Fractured Powerstone', 'Liquimetal Torque', 'Mind Stone',
    'Prismatic Lens', 'Thought Vessel', 'The Irencrag',
  ],
  rock2t: [], // caillou coût 2 engagé — aucun dans cette liste
  rock3: [], // caillou coût 3 (type Solar Transformer) — aucun dans cette liste
  basalt: ['Basalt Monolith'],
  mightstone: ['The Mightstone and Weakstone'],
  sol: ['Sol Talisman'],

  // — SORTS À 1 (10) —
  one: [
    'Campfire', 'Expedition Map', 'Ghost Vacuum', 'Skateboard', 'Stone of Erech',
    'World Map', 'Soul-Guide Lantern', 'Retrofitter Foundry',
  ],
  chrom: ['Chromatic Sphere', 'Chromatic Star'],

  // — SORTS À 2 non-créature (5) —
  two: ['Defense Grid', 'Disruptor Flute', 'Spatial Contortion', 'Warping Wail', "Kozilek's Command"],

  // — CRÉATURES (3) —
  creature: ['Glaring Fleshraker', 'Patchwork Automaton', 'Hope of Ghirapur'],

  // — AUTRES non-créature (7) —
  o3: ['Tezzeret, Cruel Captain', 'Nettlecyst'],
  o4: ['Karn, Scion of Urza', 'Mystic Forge', 'Eldrazi Confluence'], // Eldrazi Confluence = {2}{C}{C} = 4
  o5: ['Forsaken Monument'],
  o6: [],
  o7: ['Ugin, Eye of the Storms'],
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
