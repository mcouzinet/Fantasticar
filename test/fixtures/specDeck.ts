import type { Card, Deck, Kind } from '../../lib/engine/types'

/**
 * Decklist de RÉFÉRENCE D'ORIGINE de la spec (§3.2), conservée comme fixture pour
 * continuer à valider le moteur contre les valeurs §7. (La decklist par défaut de
 * l'app a depuis été remplacée par une autre liste — cf. lib/engine/referenceDeck.ts.)
 *
 * Seule correction appliquée vs la spec : Fractured Powerstone = caillou à 2 (rock2u).
 */
const NAMES_BY_KIND: Partial<Record<Kind, string[]>> = {
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
  zero: [
    'Astral Cornucopia', 'Bone Saw', "Briber's Purse", 'Chimeric Mass',
    'Claws of Gix', 'Clown Car', 'Dark Sphere', "Delif's Cone",
    'Engineered Explosives', 'Everflowing Chalice', 'Fountain of Youth',
    'Jeweled Amulet', 'Lodestone Bauble', "Mishra's Bauble", 'Orochi Hatchery',
    'Paradise Mantle', 'Scale of Chiss-Goria', 'Sigil of Distinction',
    'Spidersilk Net', 'Tooth of Chiss-Goria', "Tormod's Crypt", "Urza's Bauble",
    'Welding Jar', 'Zuran Orb',
  ],
  rock2u: ['Fellwar Stone', 'Fractured Powerstone', 'Liquimetal Torque', 'Mind Stone', 'Prismatic Lens', 'Thought Vessel'],
  rock2t: ['Coldsteel Heart', 'Guardian Idol'],
  rock3: ['Solar Transformer'],
  one: ['Campfire', 'Expedition Map', 'Ghost Vacuum', 'Skateboard', 'Stone of Erech', 'World Map'],
  chrom: ['Chromatic Sphere', 'Chromatic Star'],
  two: ['Defense Grid', 'Disruptor Flute', 'Null Elemental Blast', 'Spatial Contortion', 'Warping Wail', "Kozilek's Command"],
  creature: ['Glaring Fleshraker', 'It That Heralds the End', 'Metallic Mimic', 'Patchwork Automaton', 'Skittering Cicada', 'Steel Overseer'],
  o3: ['Tangle Wire', 'Tezzeret Cruel Captain'],
  o4: ['Mystic Forge', 'Karn Scion of Urza'],
  o5: ['Forsaken Monument', 'Eldrazi Confluence'],
  o6: ['Ugin the Ineffable'],
  o7: ['Ugin Eye of the Storms'],
}

export const SPEC_DECK: Deck = {
  cards: (Object.keys(NAMES_BY_KIND) as Kind[]).flatMap((kind) =>
    (NAMES_BY_KIND[kind] ?? []).map((name): Card => ({ name, kind, qty: 1 })),
  ),
}
