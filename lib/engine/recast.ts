import type { Deck, SimConfig, SpellTable } from './types'
import { kindCode } from './types'
import { DEFAULT_SPELL_TABLE, FANTASTICAR_COST } from './spellTable'
import { mulberry32 } from './prng'
import { newHand } from './hand'
import { emptyBattlefield, promote, type Battlefield } from './mana'
import { buildComboContext, bestCombo, commitCombo, type ComboContext } from './combo'
import { buildDevelopContext, develop, scryKeep, type DevelopContext } from './develop'
import { openingHand } from './mulligan'
import { resetBattlefield, gemstoneOpening } from './game'
import { buildDeckBuffer } from './deckBuffer'

/**
 * « Repartir » après un premier combo : on conditionne sur les parties ayant déclenché le combo
 * AU PLUS TARD à T3 (la cible), puis on continue à jouer pour mesurer quand on peut RELANCER la
 * Fantasticar (depuis la zone de commandement, +2 de taxe) avec 3 nouveaux sorts non-créature.
 *
 * Modèle (v1, volontairement simple) :
 *  - 1 seul recast mesuré (le 2ᵉ combo, Fantasticar à coût base+2).
 *  - À l'exécution du 1er combo, les 3 sorts lancés quittent la main, les cailloux restent en jeu,
 *    la Fantasticar retourne en zone de commandement (taxe +2). Le tour du combo n'est pas re-développé.
 *  - On simule jusqu'à RECAST_MAX_TURN pour laisser le temps au recast.
 */
export interface RecastResult {
  games: number // parties simulées (2 axes)
  conditioned: number // parties ayant combo ≤ T3 (population de base)
  condRate: number // conditioned / games
  firstAvgTurn: number // tour moyen du 1er combo (parmi conditionnées)
  recastByTurn: { turn: number; cum: number }[] // P(recast ≤ turn) parmi conditionnées, turns 4..max
  recastEver: number // P(recast au moins une fois ≤ max) parmi conditionnées
  recastAvgTurn: number // tour moyen du recast (parmi celles qui recastent)
  maxTurn: number
}

const GEM = kindCode.gemstone
const LAND = kindCode.land
const RECAST_MAX_TURN = 8 // on prolonge au-delà de T5 pour voir le recast

interface RecastDeps {
  deckBuf: Int8Array
  rng: ReturnType<typeof mulberry32>
  hand: Int16Array
  bf: Battlefield
  comboCtx: ComboContext
  devCtx: DevelopContext
  table: SpellTable
  mode: SimConfig['mulligan']
}

/** Une partie : renvoie [tour du 1er combo (0 si aucun ≤ maxTurn), tour du recast (0 si aucun)]. */
function playRecast(deps: RecastDeps, onPlay: boolean): [number, number] {
  const { deckBuf, rng, hand, bf, comboCtx, devCtx, table, mode } = deps
  let pointer = openingHand(deckBuf, rng, mode, hand)
  resetBattlefield(bf)
  gemstoneOpening(hand, bf, onPlay)

  let first = 0
  let recast = 0
  let casts = 0 // nb de fois que la Fantasticar a été lancée (taxe = 2 × casts)

  for (let t = 1; t <= RECAST_MAX_TURN; t++) {
    if (t > 1 || !onPlay) {
      if (pointer < deckBuf.length) {
        const code = deckBuf[pointer++]!
        hand[code === GEM ? LAND : code]!++ // Gemstone pioché = simple terrain
      }
    }
    promote(bf)

    if (t >= 2) {
      const fanCost = FANTASTICAR_COST + 2 * casts
      if (bestCombo(comboCtx, hand, bf, false, fanCost)) {
        if (first === 0) {
          first = t
          if (first > 3) return [first, 0] // hors population (on ne garde que les combos ≤ T3)
          commitCombo(comboCtx, hand, bf, table, fanCost) // exécute : retire les sorts, garde les cailloux
          casts++
          continue // le tour du combo est « consommé » ; on ne re-développe pas
        }
        recast = t
        return [first, recast]
      }
    }

    develop(devCtx, hand, bf, false, RECAST_MAX_TURN - t)
    while (bf.scry > 0 && pointer < deckBuf.length) {
      if (!scryKeep(hand, deckBuf[pointer]!)) pointer++
      bf.scry -= 1
    }
    bf.scry = 0
  }
  return [first, recast]
}

export function recastSim(deck: Deck, config: SimConfig): RecastResult {
  const table = DEFAULT_SPELL_TABLE
  const deps: RecastDeps = {
    deckBuf: buildDeckBuffer(deck),
    rng: mulberry32(config.seed >>> 0),
    hand: newHand(),
    bf: emptyBattlefield(),
    comboCtx: buildComboContext(table),
    devCtx: buildDevelopContext(table),
    table,
    mode: config.mulligan,
  }

  let games = 0
  let conditioned = 0
  let firstSum = 0
  let recastSum = 0
  let recastCount = 0
  const cum = new Int32Array(RECAST_MAX_TURN + 1) // cum[t] = nb de recasts au tour t exactement

  const runAxis = (onPlay: boolean): void => {
    for (let i = 0; i < config.iterations; i++) {
      games++
      const [first, recast] = playRecast(deps, onPlay)
      if (first < 2 || first > 3) continue // population : 1er combo ≤ T3
      conditioned++
      firstSum += first
      if (recast > 0) {
        recastCount++
        recastSum += recast
        cum[recast]!++
      }
    }
  }
  runAxis(true)
  runAxis(false)

  // Cumulatif P(recast ≤ turn) parmi les parties conditionnées.
  const recastByTurn: { turn: number; cum: number }[] = []
  let acc = 0
  for (let t = 4; t <= RECAST_MAX_TURN; t++) {
    acc += cum[t]!
    recastByTurn.push({ turn: t, cum: conditioned ? acc / conditioned : 0 })
  }

  return {
    games,
    conditioned,
    condRate: games ? conditioned / games : 0,
    firstAvgTurn: conditioned ? firstSum / conditioned : 0,
    recastByTurn,
    recastEver: conditioned ? recastCount / conditioned : 0,
    recastAvgTurn: recastCount ? recastSum / recastCount : 0,
    maxTurn: RECAST_MAX_TURN,
  }
}
