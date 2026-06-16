import type { Deck, SimConfig, SpellTable } from './types'
import { KIND_COUNT, kindCode } from './types'
import { DEFAULT_SPELL_TABLE } from './spellTable'
import { mulberry32 } from './prng'
import { newHand } from './hand'
import { emptyBattlefield, promote, type LandDrop } from './mana'
import { buildComboContext, traceCombo } from './combo'
import { buildDevelopContext, develop, scryKeep } from './develop'
import { openingHand } from './mulligan'

export interface T2CardFreq {
  name: string // nom de carte
  count: number // nb de combos T2 où la carte apparaît
}

export interface T2RecipesResult {
  cards: T2CardFreq[] // cartes présentes dans les combos T2, triées par fréquence décroissante
  t2Count: number // nombre total de combos T2 échantillonnés (2 axes)
  games: number // parties simulées (2 × itérations)
}

const DROP_KIND: Partial<Record<LandDrop, number>> = {
  land: kindCode.land, landGrant: kindCode.landGrant, landScry: kindCode.landScry,
  landT: kindCode.landT, vein: kindCode.vein, city: kindCode.city, land0: kindCode.land0,
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

  const cardCount = new Map<string, number>() // nom → nb de combos T2 contenant la carte
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
      let fCast = false

      for (let t = 1; t <= config.maxTurn; t++) {
        if (t > 1 || !onPlay) {
          if (pointer < total) {
            const kc = deckBuf[pointer]!
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
              recipe.push('The Fantasticar')
              for (const n of new Set(recipe)) cardCount.set(n, (cardCount.get(n) ?? 0) + 1)
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

  const cards: T2CardFreq[] = [...cardCount.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return { cards, t2Count, games: config.iterations * 2 }
}
