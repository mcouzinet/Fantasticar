import type { Card, Deck, Kind } from './types'

/**
 * Decklist de référence (spec §3.2). Total = 99 (le Fantasticar est le commander,
 * hors des 99, traité à part par le moteur).
 *
 * Cette donnée est la "source de vérité" par défaut ; l'utilisateur peut l'éditer
 * depuis l'UI. La catégorisation (kind) porte tout le comportement mécanique.
 */
const NAMES_BY_KIND: Record<Kind, string[]> = {
  // — LANDS (38) —
  land: [
    'Abstergo Entertainment', 'Blast Zone', 'Command Beacon', 'Conduit Pylons',
    'Crystal Grotto', 'Darksteel Citadel', 'Deserted Temple', 'Dust Bowl',
    'Gallifrey Council Chamber', 'Gemstone Caverns', "Inventors' Fair",
    "Mishra's Factory", "Mishra's Foundry", 'Mutavault', 'Planar Nexus',
    'Radiant Fountain', 'Rishadan Port', 'Scavenger Grounds', 'Scorched Ruins',
    'Snow-Covered Wastes', 'Talon Gates of Madara', 'The Grey Havens',
    "Thespian's Stage", "Urza's Cave", "Urza's Mine", "Urza's Power Plant",
    "Urza's Tower", "Urza's Saga", "Urza's Workshop", 'Vesuva', 'War Room',
    'Zhalfirin Void',
  ],
  landT: ['Arid Archway', 'Guildless Commons', 'Echoing Deeps', 'Hidden Grotto'],
  city: ['City of Traitors'],
  vein: ['Crystal Vein'],

  // — SORTS À 0 (24) —
  zero: [
    'Astral Cornucopia', 'Bone Saw', "Briber's Purse", 'Chimeric Mass',
    'Claws of Gix', 'Clown Car', 'Dark Sphere', "Delif's Cone",
    'Engineered Explosives', 'Everflowing Chalice', 'Fountain of Youth',
    'Jeweled Amulet', 'Lodestone Bauble', "Mishra's Bauble", 'Orochi Hatchery',
    'Paradise Mantle', 'Scale of Chiss-Goria', 'Sigil of Distinction',
    'Spidersilk Net', 'Tooth of Chiss-Goria', "Tormod's Crypt", "Urza's Bauble",
    'Welding Jar', 'Zuran Orb',
  ],

  // — CAILLOUX (9) —
  rock2u: ['Fellwar Stone', 'Liquimetal Torque', 'Mind Stone', 'Prismatic Lens', 'Thought Vessel'],
  rock2t: ['Coldsteel Heart', 'Guardian Idol'],
  rock1: ['Fractured Powerstone'],
  rock3: ['Solar Transformer'],

  // — SORTS À 1 (8) —
  one: ['Campfire', 'Expedition Map', 'Ghost Vacuum', 'Skateboard', 'Stone of Erech', 'World Map'],
  chrom: ['Chromatic Sphere', 'Chromatic Star'],

  // — SORTS À 2 non-créature (6) —
  two: [
    'Defense Grid', 'Disruptor Flute', 'Null Elemental Blast',
    'Spatial Contortion', 'Warping Wail', "Kozilek's Command",
  ],

  // — CRÉATURES (6) —
  creature: [
    'Glaring Fleshraker', 'It That Heralds the End', 'Metallic Mimic',
    'Patchwork Automaton', 'Skittering Cicada', 'Steel Overseer',
  ],

  // — AUTRES non-créature (8) —
  o3: ['Tangle Wire', 'Tezzeret Cruel Captain'],
  o4: ['Mystic Forge', 'Karn Scion of Urza'],
  o5: ['Forsaken Monument', 'Eldrazi Confluence'],
  o6: ['Ugin the Ineffable'],
  o7: ['Ugin Eye of the Storms'],
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
