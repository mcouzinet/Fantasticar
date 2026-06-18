import type { Deck, Kind, SimConfig, SpellTable } from './types'
import { KIND_COUNT, KINDS, kindCode } from './types'
import { DEFAULT_SPELL_TABLE } from './spellTable'
import { mulberry32 } from './prng'
import { newHand } from './hand'
import { emptyBattlefield, promote, type LandDrop } from './mana'
import { buildComboContext, traceCombo } from './combo'
import { buildDevelopContext, develop, scryKeep } from './develop'
import { openingHand } from './mulligan'

export interface T2Combo {
  label: string // recette lisible, ex. « City of Traitors + terrain + 3× sort à 0 »
  count: number // nb de combos T2 correspondant à cette recette
}

export interface T2RecipesResult {
  combos: T2Combo[] // recettes (combinaisons de mana) triées par fréquence décroissante
  t2Count: number // nombre total de combos T2 échantillonnés (2 axes)
  distinct: number // nombre de recettes distinctes
  games: number // parties simulées (2 × itérations)
}

// Jeton normalisé par carte pour la signature de recette. `city` est traité par NOM
// (City of Traitors vs Crystal Vein, distincts pour le joueur même si même profil).
const TOKEN: Partial<Record<Kind, string>> = {
  zero: 'sort à 0',
  one: 'sort à 1', chrom: 'sort à 1', two: 'sort à 2',
  o3: 'sort cher', o4: 'sort cher', o5: 'sort cher', o6: 'sort cher', o7: 'sort cher',
  land: 'terrain', landT: 'terrain', landScry: 'terrain', landGrant: 'terrain', land0: 'terrain',
  gemstone: 'terrain',
  amulet: 'Jeweled Amulet',
  // planarNexus + pièces Tron : jeton dynamique (terrain Tron seulement si le set est productif).
  scorched: 'Scorched Ruins',
  rock2u: 'caillou', rock2t: 'caillou', rock3: 'caillou',
  basalt: 'Basalt Monolith', mightstone: 'Mightstone', sol: 'Sol Talisman',
}
// Ordre d'affichage dans la signature : activateurs nommés d'abord, terrains, puis sorts (à 0 en dernier).
function prio(tok: string): number {
  if (tok === 'sort à 0') return 9
  if (tok === 'sort à 1' || tok === 'sort à 2' || tok === 'sort cher') return 8
  if (tok === 'caillou') return 6
  if (tok === 'terrain') return 5
  if (tok === 'terrain Tron') return 4
  return 1 // activateurs nommés (City/Vein, Amulet, Nexus, Scorched, Basalt…)
}
function signature(tokens: Map<string, number>): string {
  return [...tokens.entries()]
    .sort((a, b) => prio(a[0]) - prio(b[0]) || a[0].localeCompare(b[0]))
    .map(([tok, n]) => (n > 1 ? `${n}× ${tok}` : tok))
    .join(' + ')
}

const GEM = kindCode.gemstone
const LAND = kindCode.land
// Gemstone Caverns (free-start sur la draw) : carte exilée = la moins utile au combo (cf. game.ts).
const EXILE_ORDER: number[] = [
  kindCode.creature, kindCode.o7, kindCode.o6, kindCode.o5, kindCode.o4, kindCode.o3,
  kindCode.mightstone, kindCode.land0, kindCode.sol, kindCode.dynamo, kindCode.rock3,
  kindCode.two, kindCode.landT, kindCode.one, kindCode.chrom,
  kindCode.rock2t, kindCode.rock2u, kindCode.basalt,
  kindCode.landScry, kindCode.landGrant, kindCode.land,
  kindCode.urzaMine, kindCode.urzaPP, kindCode.urzaTower, kindCode.planarNexus,
  kindCode.scorched, kindCode.vein, kindCode.city, kindCode.cloud,
  kindCode.zero, kindCode.amulet,
]

const DROP_KIND: Partial<Record<LandDrop, number>> = {
  land: kindCode.land, landGrant: kindCode.landGrant, landScry: kindCode.landScry,
  landT: kindCode.landT, vein: kindCode.vein, city: kindCode.city, land0: kindCode.land0,
  scorched: kindCode.scorched,
  urzaMine: kindCode.urzaMine, urzaPP: kindCode.urzaPP, urzaTower: kindCode.urzaTower, planarNexus: kindCode.planarNexus,
}

/**
 * Collecte les recettes (par noms de cartes) ayant permis un combo au TOUR 2.
 * Simulateur « tracé » : suit l'identité des cartes (plus lent), séparé du moteur rapide
 * qui produit les probabilités de référence. Déterministe au même seed.
 */
export function collectT2Recipes(deck: Deck, config: SimConfig, table: SpellTable = DEFAULT_SPELL_TABLE): T2RecipesResult {
  const comboCtx = buildComboContext(table)
  const devCtx = buildDevelopContext(table)

  // Deck « par carte » : kind + nom pour chaque exemplaire.
  const kindByCard: number[] = []
  const nameByCard: string[] = []
  for (const c of deck.cards) {
    for (let q = 0; q < c.qty; q++) { kindByCard.push(kindCode[c.kind]); nameByCard.push(c.name) }
  }
  const total = kindByCard.length
  const baseKind = Int8Array.from(kindByCard)
  const nameToKind = new Map<string, number>() // nom → kindCode (pour regrouper par catégorie)
  for (let i = 0; i < total; i++) nameToKind.set(nameByCard[i]!, kindByCard[i]!)

  const comboCount = new Map<string, number>() // signature de recette → nb de combos T2
  let t2Count = 0

  const hand = newHand()
  const deckBuf = new Int8Array(total)
  const idBuf = new Int16Array(total)
  const before = new Int16Array(KIND_COUNT)

  const popName = (handCards: string[][], kc: number): string => handCards[kc]!.pop() ?? '?'

  const runAxis = (onPlay: boolean, seed: number): void => {
    const rng = mulberry32(seed >>> 0)
    for (let it = 0; it < config.iterations; it++) {
      deckBuf.set(baseKind)
      for (let i = 0; i < total; i++) idBuf[i] = i
      hand.fill(0)
      let pointer = openingHand(deckBuf, rng, config.mulligan, hand, idBuf)

      // Reconstitue les noms en main par kind (les exemplaires d'un même kind sont équivalents).
      const handCards: string[][] = Array.from({ length: KIND_COUNT }, () => [])
      const filled = new Int16Array(KIND_COUNT)
      for (let i = 0; i < 7; i++) {
        const kc = deckBuf[i]!
        if (filled[kc]! < hand[kc]!) { handCards[kc]!.push(nameByCard[idBuf[i]!]!); filled[kc]!++ }
      }

      const bf = emptyBattlefield()
      const battlefield: string[] = [] // cartes posées/lancées (sources de mana des tours précédents)

      // Gemstone Caverns : sur la draw, s'il est en main d'ouverture, il démarre en jeu (+exil).
      if (!onPlay && hand[GEM]! > 0) {
        hand[GEM]!--
        battlefield.push(handCards[GEM]!.pop() ?? 'Gemstone Caverns') // en jeu → 'terrain' dans la recette
        bf.plain += 1
        for (const c of EXILE_ORDER) { if (hand[c]! > 0) { hand[c]!--; handCards[c]!.pop(); break } }
      }
      while (hand[GEM]! > 0) { // tout Gemstone restant = terrain normal (nom transféré)
        hand[GEM]!--; hand[LAND]!++
        const n = handCards[GEM]!.pop(); if (n) handCards[LAND]!.push(n)
      }

      let fCast = false

      for (let t = 1; t <= config.maxTurn; t++) {
        if (t > 1 || !onPlay) {
          if (pointer < total) {
            const raw = deckBuf[pointer]!
            const kc = raw === GEM ? LAND : raw // un Gemstone pioché = simple terrain
            hand[kc]!++; handCards[kc]!.push(nameByCard[idBuf[pointer]!]!); pointer++
          }
        }
        promote(bf)

        if (t >= 2) {
          const line = traceCombo(comboCtx, hand, bf, fCast)
          if (line) {
            if (t === 2) {
              t2Count++
              const recipe = battlefield.slice()
              if (line.drop !== 'none') recipe.push(popName(handCards, DROP_KIND[line.drop]!))
              for (const sk of line.spellKinds) recipe.push(popName(handCards, sk))
              // Tron : un terrain Tron isolé (sans Nexus ni set complet) ne tape que pour 1 →
              // on le considère comme un terrain normal. Productif seulement si Nexus + ≥1 pièce,
              // ou les 3 vraies pièces présentes.
              let nexus = 0, mineP = false, ppP = false, towerP = false, realTron = 0
              for (const n of recipe) {
                const kind = KINDS[nameToKind.get(n) ?? -1]
                if (kind === 'planarNexus') nexus++
                else if (kind === 'urzaMine') { mineP = true; realTron++ }
                else if (kind === 'urzaPP') { ppP = true; realTron++ }
                else if (kind === 'urzaTower') { towerP = true; realTron++ }
              }
              const tronOn = nexus > 0 ? realTron > 0 : mineP && ppP && towerP

              // Jeweled Amulet : « activateur » seulement si chargée (bankée) — elle est alors dans
              // le battlefield. Si elle est lancée le tour du combo (pas dans le battlefield), c'est
              // juste un sort à 0 (cheerio). Singleton → un seul rôle possible par partie.
              const amuletIsMana = battlefield.some((n) => KINDS[nameToKind.get(n) ?? -1] === 'amulet')

              // Signature de recette : on nomme les activateurs (City/Vein…) et on COMPTE les
              // terrains et sorts à 0 (« cheerios ») au lieu de les énumérer.
              const tokens = new Map<string, number>()
              for (const n of recipe) {
                const code = nameToKind.get(n)
                if (code === undefined) continue // « The Fantasticar » (commander)
                const kind = KINDS[code]!
                if (kind === 'sol') continue // Sol Talisman : suspend 3, ne se résout jamais avant le T2
                let tok: string
                if (kind === 'city' || kind === 'vein') tok = n // activateurs nommés (City of Traitors / Crystal Vein)
                else if (kind === 'amulet') tok = amuletIsMana ? 'Jeweled Amulet' : 'sort à 0'
                else if (kind === 'urzaMine' || kind === 'urzaPP' || kind === 'urzaTower') tok = tronOn ? 'terrain Tron' : 'terrain'
                else if (kind === 'planarNexus') tok = tronOn ? 'Planar Nexus' : 'terrain'
                else tok = TOKEN[kind] ?? n
                tokens.set(tok, (tokens.get(tok) ?? 0) + 1)
              }
              const sig = signature(tokens)
              comboCount.set(sig, (comboCount.get(sig) ?? 0) + 1)
            }
            break // la partie s'arrête au combo
          }
        }

        before.set(hand)
        fCast = develop(devCtx, hand, bf, fCast, config.maxTurn - t)
        // Réconcilie les cartes retirées de la main par develop → « posées » (battlefield).
        for (let kc = 0; kc < KIND_COUNT; kc++) {
          let removed = before[kc]! - hand[kc]!
          while (removed-- > 0) battlefield.push(popName(handCards, kc))
        }
        // Résolution scry/surveil (miroir de game.ts) : saute la prochaine carte du deck si inutile.
        while (bf.scry > 0 && pointer < total) {
          if (!scryKeep(hand, deckBuf[pointer]!)) pointer++
          bf.scry -= 1
        }
        bf.scry = 0
      }
    }
  }

  runAxis(true, config.seed)
  runAxis(false, (config.seed ^ 0x9e3779b9) >>> 0)

  const all = [...comboCount.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)

  return { combos: all.slice(0, 20), t2Count, distinct: all.length, games: config.iterations * 2 }
}
