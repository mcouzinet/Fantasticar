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
  recastByAfter: { after: number; cum: number }[] // P(recast dans ≤ +after tours) parmi conditionnées
  recastEver: number // P(recast dans ≤ +MAX_AFTER tours) parmi conditionnées
  recastAvgAfter: number // nb moyen de tours après le combo pour le recast (parmi celles qui recastent)
  maxAfter: number
}

const GEM = kindCode.gemstone
const LAND = kindCode.land
const MAX_AFTER = 5 // on mesure le recast jusqu'à +5 tours après le combo
const RECAST_MAX_TURN = 3 + MAX_AFTER // 1er combo ≤ T3 → fenêtre d'observation identique pour tous (≤ +5)

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
  let afterSum = 0
  let recastCount = 0
  const cum = new Int32Array(MAX_AFTER + 1) // cum[d] = nb de recasts à exactement +d tours après le combo

  const runAxis = (onPlay: boolean): void => {
    for (let i = 0; i < config.iterations; i++) {
      games++
      const [first, recast] = playRecast(deps, onPlay)
      if (first < 2 || first > 3) continue // population : 1er combo ≤ T3
      conditioned++
      firstSum += first
      const d = recast - first // nb de tours après le combo
      if (recast > 0 && d >= 1 && d <= MAX_AFTER) {
        recastCount++
        afterSum += d
        cum[d]!++
      }
    }
  }
  runAxis(true)
  runAxis(false)

  // Cumulatif P(recast dans ≤ +after tours) parmi les parties conditionnées.
  const recastByAfter: { after: number; cum: number }[] = []
  let acc = 0
  for (let d = 1; d <= MAX_AFTER; d++) {
    acc += cum[d]!
    recastByAfter.push({ after: d, cum: conditioned ? acc / conditioned : 0 })
  }

  return {
    games,
    conditioned,
    condRate: games ? conditioned / games : 0,
    firstAvgTurn: conditioned ? firstSum / conditioned : 0,
    recastByAfter,
    recastEver: conditioned ? recastCount / conditioned : 0,
    recastAvgAfter: recastCount ? afterSum / recastCount : 0,
    maxAfter: MAX_AFTER,
  }
}
